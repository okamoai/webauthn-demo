import base64url from 'base64url'

const isProduction = process.env.NODE_ENV === 'production'

export const rpId = isProduction ? 'webauthn-demo.firebaseapp.com' : 'localhost'

export const origin = isProduction ? `https://${rpId}` : `http://${rpId}:8080`

export const makeCreatePublicKey = ({ userId, challenge }) => ({
  publicKey: {
    rp: {
      id: rpId,
      name: 'WebAuthn Demo',
    },
    user: {
      id: base64url.toBuffer(userId).buffer,
      name: userId,
      displayName: userId,
    },
    pubKeyCredParams: [
      {
        type: 'public-key',
        alg: -7,
      },
      {
        type: 'public-key',
        alg: -257,
      },
    ],
    challenge: base64url.toBuffer(challenge).buffer,
  },
})

export const makeGetPublicKey = ({ credentialId, challenge }) => ({
  publicKey: {
    allowCredentials: [
      {
        transports: ['internal'],
        type: 'public-key',
        id: base64url.toBuffer(credentialId).buffer,
      },
    ],
    challenge: base64url.toBuffer(challenge).buffer,
  },
})
