import crypto from 'crypto'
import cbor from 'cbor-js'
import base64url from 'base64url'
import arrayBufferToBuffer from 'arraybuffer-to-buffer'
import uuid from 'uuid-parse'

const isProduction = process.env.NODE_ENV === 'production'
const rpId = isProduction ? 'webauthn-demo.firebaseapp.com' : 'localhost'
const origin = isProduction ? `https://${rpId}` : `http://${rpId}:8080`

export const bufferToArrayBuffer = buf => {
  const ab = new ArrayBuffer(buf.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buf.length; i += 1) {
    view[i] = buf[i]
  }
  return ab
}

export const sha256 = data => {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest()
}

export const derToPEM = der => `-----BEGIN CERTIFICATE-----
${der}
-----END CERTIFICATE-----`

export const decodeCobr = buf => cbor.decode(bufferToArrayBuffer(buf))

export const parseAuthData = authData => {
  const rpIdHash = authData.slice(0, 32)
  const flags = authData[32]
  // eslint-disable-next-line no-bitwise
  const signCount = (authData[33] << 24) | (authData[34] << 16) | (authData[35] << 8) | authData[36]
  const aaguid = uuid.unparse(authData.slice(37, 53)).toUpperCase()
  // eslint-disable-next-line no-bitwise
  const credentialIdLength = (authData[53] << 8) + authData[54]
  // eslint-disable-next-line no-unused-vars
  const credentialId = authData.slice(55, 55 + credentialIdLength)
  const credentialPublicKey = authData.slice(55 + credentialIdLength)
  return {
    rpIdHash,
    flags,
    signCount,
    aaguid,
    credentialIdLength,
    credentialId,
    credentialPublicKey,
  }
}

export const coseToJwk = cose => {
  try {
    let publicKeyJwk = {}
    const publicKeyCbor = cbor.decode(cose)
    if (publicKeyCbor[3] === -7) {
      publicKeyJwk = {
        kty: 'EC',
        crv: 'P-256',
        x: base64url(publicKeyCbor[-2]),
        y: base64url(publicKeyCbor[-3]),
      }
    } else if (publicKeyCbor[3] === -257) {
      publicKeyJwk = {
        kty: 'RSA',
        n: base64url(publicKeyCbor[-1]),
        e: base64url(publicKeyCbor[-2]),
      }
    } else {
      throw new Error('Unknown public key algorithm')
    }
    return publicKeyJwk
  } catch (e) {
    throw new Error('Could not decode COSE Key')
  }
}

export const isNotMatchRpId = hash => sha256(rpId).equals(arrayBufferToBuffer(hash)) === false

export const isNotMatchOrigin = clientOrigin => origin !== clientOrigin

// eslint-disable-next-line no-bitwise
export const disabledFlagsUp = flags => Boolean(flags & 0x01) === false

// eslint-disable-next-line no-bitwise
export const disabledFlagsUv = flags => Boolean(flags & 0x04) === false

export const invalidSignature = ({
  authData,
  clientDataJSON,
  signature,
  pem,
  cryptType = 'sha256',
}) => {
  const clientDataHash = sha256(clientDataJSON)
  const verify = crypto.createVerify(cryptType)
  verify.update(authData)
  verify.update(clientDataHash)
  return !verify.verify(pem, signature)
}
