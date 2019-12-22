import express from 'express'
import base64url from 'base64url'
import jwkToPem from 'jwk-to-pem'
import * as firebase from 'firebase-admin'
import firebaseConfig from './firebase.config'
import {
  decodeCobr,
  parseAuthData,
  coseToJwk,
  derToPEM,
  isNotMatchOrigin,
  isNotMatchRpId,
  disabledFlagsUp,
  disabledFlagsUv,
  invalidSignature,
} from './utils'

firebase.initializeApp(firebaseConfig)

const router = express.Router()
const db = firebase.firestore()

// ---- チャレンジ発行 API（新規）
router.post('/api/attestation/challenge', async (req, res) => {
  const { userId } = req.body

  // Step 2. チャレンジを発行し、ユーザ識別情報に紐づけてデータベースに保存
  const challenge = await db
    .collection('challenge')
    .add({
      userId,
      timestamp: new Date().getTime(),
    })
    .then(docRef => docRef.id)

  // Step 3. 発行したチャレンジをレスポンスで返す
  res.header('Content-Type', 'application/json; charset=utf-8')
  res.send({ challenge })
})

// ---- 公開鍵保存 API
router.post('/api/attestation/register', async (req, res) => {
  // Step 7. clientDataJSON, attestationObject を base64 デコード
  const rawClientDataJSON = base64url.decode(req.body.clientDataJSON)
  const clientDataJSON = JSON.parse(rawClientDataJSON)
  const attestationObjectBuffer = base64url.toBuffer(req.body.attestationObject)

  res.header('Content-Type', 'application/json; charset=utf-8')

  // type の一致を確認
  if (clientDataJSON.type !== 'webauthn.create') {
    res.status(401).send({ message: 'clientDataJSON.type is Disagreement.' })
    return
  }

  // Step 8. チャレンジをデータベースに照会してユーザーの正当性を検証
  const userId = await db
    .collection('challenge')
    .doc(clientDataJSON.challenge)
    .get()
    .then(doc => (doc.exists ? doc.get('userId') : null))
  if (!userId) {
    res.status(401).send({ message: 'clientDataJSON.challenge is Disagreement.' })
    return
  }

  // Step 9. origin が認証処理を行った FQDN と一致しているか検証
  if (isNotMatchOrigin(clientDataJSON.origin)) {
    res.status(401).send({ message: 'clientDataJSON.origin is Disagreement.' })
    return
  }

  // Step 10. attestationObject を CBOR デコード
  const attestationObject = decodeCobr(attestationObjectBuffer)
  const { fmt, attStmt, authData } = attestationObject

  // Step 11. attestationObject.authData をパース
  const {
    rpIdHash,
    flags,
    signCount,
    aaguid,
    credentialIdLength,
    credentialPublicKey,
  } = parseAuthData(authData)

  // Step 12. attestationObject.authData.credentialPublicKey の公開鍵情報を JWK に変換
  const publicKeyJwk = coseToJwk(credentialPublicKey.buffer)

  // Step 13. attestationObject.attStmt の署名を検証
  switch (fmt) {
    case 'packed':
      if ('x5c' in attStmt) {
        const [attestnCert] = attStmt.x5c
        const pem = derToPEM(base64url(attestnCert))
        const signature = attStmt.sig
        if (
          invalidSignature({
            authData,
            clientDataJSON: rawClientDataJSON,
            pem,
            signature,
          })
        ) {
          res.status(401).send({ message: 'Could not verify signature.' })
          return
        }
      } else {
        const cryptType = publicKeyJwk.kty === 'RSA' ? 'RSA-SHA256' : 'sha256'
        const pem = jwkToPem(publicKeyJwk)
        const signature = attStmt.sig
        if (
          invalidSignature({
            authData,
            clientDataJSON: rawClientDataJSON,
            pem,
            signature,
            cryptType,
          })
        ) {
          res.status(401).send({ message: 'Could not verify signature.' })
          return
        }
      }
      break
    case 'android-key':
    case 'android-safetynet':
    case 'tpm':
    case 'fido-u2f':
    default:
      break
  }

  // Step 14. attestationObject.authData.rpIdHash を検証
  if (isNotMatchRpId(rpIdHash)) {
    res.status(401).send({ message: 'authData.rpIdHash is Disagreement.' })
    return
  }

  // Step 15. attestationObject.authData.flags を検証
  // Flags UP の一致を確認
  if (disabledFlagsUp(flags)) {
    res.status(401).send({ message: 'authData.flags.up is Disagreement.' })
    return
  }
  // Flags UV の一致を確認
  if (disabledFlagsUv(flags)) {
    res.status(401).send({ message: 'authData.flags.uv is Disagreement.' })
    return
  }

  // Step 16. 認証情報をデータベースに保存
  await db
    .collection('credential')
    .doc(userId)
    .set({
      id: req.body.id,
      jwk: publicKeyJwk,
      signCount,
      timestamp: new Date().getTime(),
    })

  // Step 17. クライアントにレスポンスを返す
  res.send({
    clientDataJSON,
    attestationObject: {
      fmt,
      authData: 'ArrayBuffer',
      attStmt: {
        alg: attStmt.alg,
        sig: 'ArrayBuffer',
      },
    },
    authData: {
      rpIdHash: 'ArrayBuffer',
      flags,
      signCount,
      aaguid,
      credentialIdLength,
      credentialId: 'ArrayBuffer',
      credentialPublicKey: 'ArrayBuffer',
    },
    credentialPublicKey: publicKeyJwk,
  })
})

// ---- チャレンジ発行 API（認証）
router.post('/api/assertion/challenge', async (req, res) => {
  const { userId } = req.body

  // Step 2. チャレンジを発行し、ユーザ識別情報に紐づけてデータベースに保存し認証IDを取得
  const credentialId = await db
    .collection('credential')
    .doc(userId)
    .get()
    .then(doc => (doc.exists ? doc.get('id') : null))
  const challenge = await db
    .collection('challenge')
    .add({
      userId,
      timestamp: new Date().getTime(),
    })
    .then(docRef => docRef.id)

  // Step 3. 発行したチャレンジと認証IDをレスポンスで返す
  res.header('Content-Type', 'application/json; charset=utf-8')
  res.send({ challenge, credentialId })
})

// ---- 公開鍵検証 API
router.post('/api/assertion/verify', async (req, res) => {
  // Step 7. clientDataJSON, authenticatorData, signature を base64 デコード
  const rawClientDataJSON = base64url.decode(req.body.clientDataJSON)
  const clientDataJSON = JSON.parse(rawClientDataJSON)
  const authData = base64url.toBuffer(req.body.authenticatorData)
  const signature = base64url.toBuffer(req.body.signature)

  res.header('Content-Type', 'application/json; charset=utf-8')

  // type の一致を確認
  if (clientDataJSON.type !== 'webauthn.get') {
    res.status(401).send({ message: 'clientDataJSON.type is Disagreement.' })
    return
  }

  // Step 8. チャレンジをデータベースに照会してユーザーの正当性を検証
  const userId = await db
    .collection('challenge')
    .doc(clientDataJSON.challenge)
    .get()
    .then(doc => (doc.exists ? doc.get('userId') : null))
  if (!userId) {
    res.status(401).send({ message: 'clientDataJSON.challenge is Disagreement.' })
    return
  }

  // Step 9. origin が認証処理を行った FQDN と一致しているか検証
  if (isNotMatchOrigin(clientDataJSON.origin)) {
    res.status(401).send({ message: 'clientDataJSON.origin is Disagreement.' })
    return
  }

  // Step 10. authenticatorData をパース
  const { rpIdHash, flags, signCount } = parseAuthData(authData)

  // Step 11. authenticatorData.rpIdHash を検証
  if (isNotMatchRpId(rpIdHash)) {
    res.status(401).send({ message: 'authenticatorData.rpIdHash is Disagreement.' })
    return
  }

  // Step 12. authenticatorData.flags を検証
  // Flags UP の一致を確認
  if (disabledFlagsUp(flags)) {
    res.status(401).send({ message: 'authenticatorData.flags.up is Disagreement.' })
    return
  }
  // Flags UV の一致を確認
  if (disabledFlagsUv(flags)) {
    res.status(401).send({ message: 'authenticatorData.flags.uv is Disagreement.' })
    return
  }

  // Step 13. データベースに保存されている認証情報一式を取得する
  const credential = await db
    .collection('credential')
    .doc(userId)
    .get()
    .then(doc => (doc.exists ? doc.data() : null))

  if (credential == null) {
    res.status(401).send({ message: 'Authorization failed.' })
    return
  }

  // Step 14. signature を公開鍵で検証
  const cryptType = credential.jwk.kty === 'RSA' ? 'RSA-SHA256' : 'sha256'
  const pem = jwkToPem(credential.jwk)
  if (
    invalidSignature({
      authData,
      clientDataJSON: rawClientDataJSON,
      pem,
      signature,
      cryptType,
    })
  ) {
    res.status(401).send({ message: 'Could not verify signature.' })
    return
  }

  // Step 15. authenticatorData.signCount の値を比較検証
  if (signCount !== 0 && signCount < credential.signCount) {
    res.status(401).send({ message: 'Received signCount is less than registed signCount.' })
    return
  }

  // Step 16. authenticatorData.signCount の更新情報をデータベースに保存
  await db
    .collection('credential')
    .doc(userId)
    .update({
      signCount,
      timestamp: new Date().getTime(),
    })

  // Step 17. 従来の認証処理を行う
  // Step 18. クライアントにレスポンスを返す
  res.send({
    clientDataJSON,
    authenticatorData: {
      rpIdHash,
      flags,
      signCount,
    },
    credential,
  })
})
module.exports = router
