<template>
  <main>
    <Step
      title="Request Challenge API"
      type="client"
      :index="1"
      :step="step"
      @next="next"
    >
      <p>POST /api/attestation/challenge</p>
      <p><code>{{ params1 }}</code></p>
    </Step>
    <Step
      title="Writing Challenge DataBase"
      type="server"
      :index="2"
      :step="step"
      @next="next"
    >
      <p><code>{{ params2 }}</code></p>
    </Step>
    <Step
      title="Response Challenge API"
      type="server"
      :index="3"
      :step="step"
      @next="next"
    >
      <p>Content-type: application/json</p>
      <p><code>{{ params3 }}</code></p>
    </Step>
    <Step
      :title="`Request Credentials Create`"
      type="client"
      :index="4"
      :step="step"
      @next="next"
    >
      <p>navigator.credentials.create()</p>
      <p><code>{{ params4 }}</code></p>
    </Step>
    <Step
      :title="`Response Credentials Create`"
      type="client"
      :index="5"
      :step="step"
      @next="next"
    >
      <p><code>{{ params5 }}</code></p>
    </Step>
    <Step
      title="Request Register API"
      type="client"
      :index="6"
      :step="step"
      @next="next"
    >
      <p>POST /api/attestation/register</p>
      <p>* attestationObject and clientDataJSON encode base64</p>
      <p><code>{{ params6 }}</code></p>
    </Step>
    <Step
      title="Decode clientDataJSON from base64 and ArrayBuffer"
      type="server"
      :index="7"
      :step="step"
      @next="next"
    >
      <p><code>{{ params7 }}</code></p>
    </Step>
    <Step
      title="Collate Challenge Database and Fetch User ID"
      type="server"
      :index="8"
      :step="step"
      @next="next"
    >
      <p><code>{{ params8 }}</code></p>
    </Step>
    <Step
      title="Verify origin matches the authenticated FQDN"
      type="server"
      :index="9"
      :step="step"
      @next="next"
    >
      <ul>
        <li>Origin Match<br><code>clientDataJSON.origin === '{{ origin }}'</code></li>
      </ul>
    </Step>
    <Step
      title="Decode attestationObject from base64 and CBOR"
      type="server"
      :index="10"
      :step="step"
      @next="next"
    >
      <p>* see details <a href="https://www.w3.org/TR/webauthn/#fig-attStructs">attestationObject</a></p>
      <p>* see details <a href="http://cbor.io/">CBOR</a></p>
      <p><code>{{ params10 }}</code></p>
    </Step>
    <Step
      title="Parse attestationObject.authData from ArrayBuffer"
      type="server"
      :index="11"
      :step="step"
      @next="next"
    >
      <p><code>{{ params11 }}</code></p>
    </Step>
    <Step
      title="Create Public Key from attestationObject.authData, COSE to JWK"
      type="server"
      :index="12"
      :step="step"
      @next="next"
    >
      <p>* see details <a href="https://tools.ietf.org/html/rfc8152">COSE</a></p>
      <p>* see details <a href="https://openid-foundation-japan.github.io/rfc7517.ja.html">JWK</a></p>
      <p><code>{{ params12 }}</code></p>
    </Step>
    <Step
      title="Signature Verification"
      type="server"
      :index="13"
      :step="step"
      @next="next"
    >
      <p>* see details <a href="https://www.w3.org/TR/webauthn/#fig-signature">Generating an assertion signature</a></p>
      <p><code>{{ params13 }}</code></p>
    </Step>
    <Step
      title="Verify RPID Hash"
      type="server"
      :index="14"
      :step="step"
      @next="next"
    >
      <ul>
        <li>RPID Hash Match<br><code>sha256('{{ rpId }}').equals(rpIdHash)</code></li>
      </ul>
    </Step>
    <Step
      title="Verify Flags"
      type="server"
      :index="15"
      :step="step"
      @next="next"
    >
      <ul>
        <li>Flags UP Match<br><code>Boolean(flags & 0x01)</code></li>
        <li>Flags UV Match<br><code>Boolean(flags & 0x04)</code></li>
      </ul>
    </Step>
    <Step
      title="Writing Credential DataBase"
      type="server"
      :index="16"
      :step="step"
      @next="next"
    >
      <p><code>{{ params16 }}</code></p>
    </Step>
    <Step
      title="Response Register API"
      type="server"
      :index="17"
      :step="step"
      @next="next"
    >
      <p>Content-type: application/json</p>
      <p><code>{{ params17 }}</code></p>
    </Step>
  </main>
</template>
<script>
import axios from 'axios'
import base64url from 'base64url'
import { makeCreatePublicKey, rpId, origin } from './utils'
import Step from './Step.vue'

export default {
  name: 'SignupSteps',
  components: {
    Step,
  },
  props: {
    userId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      rpId,
      origin,
      step: 0,
      challenge: '',
      credentials: {},
      authentication: {},
      params1: '',
      params2: '',
      params3: '',
      params4: '',
      params5: '',
      params6: '',
      params7: '',
      params8: '',
      params9: '',
      params10: '',
      params11: '',
      params12: '',
      params13: '',
      params14: '',
      params15: '',
      params16: '',
      params17: '',
    }
  },
  created() {
    this.next(1)
  },
  methods: {
    async next(step) {
      this.step = step
      if (step === 1) {
        this.params1 = JSON.stringify({ userId: this.userId }, null, 2)
      } else if (step === 2) {
        this.challenge = await axios
          .post('/api/attestation/challenge', { userId: this.userId })
          .then(res => res.data.challenge)
          .catch(err => {
            // eslint-disable-next-line no-alert
            alert(err)
            throw new Error(err)
          })
        this.params2 = JSON.stringify({ challenge: this.challenge, userId: this.userId }, null, 2)
      } else if (step === 3) {
        this.params3 = JSON.stringify({ challenge: this.challenge }, null, 2)
      } else if (step === 4) {
        const publicKey = makeCreatePublicKey({ userId: this.userId, challenge: this.challenge })
        this.params4 = JSON.stringify(publicKey, null, 2)
          .replace('"id": {}', `"id": "${this.userId}" -> ArrayBuffer`)
          .replace('"challenge": {}', `"challenge": "${this.challenge}" -> ArrayBuffer`)
        this.credentials = await navigator.credentials
          .create(publicKey)
          .then(res => res)
          .catch(err => {
            // eslint-disable-next-line no-alert
            alert(err)
            throw new Error(err)
          })
      } else if (step === 5) {
        this.params5 = JSON.stringify(
          {
            id: this.credentials.id,
            rawId: 'ArrayBuffer',
            type: 'public-key',
            response: {
              attestationObject: 'ArrayBuffer',
              clientDataJSON: 'ArrayBuffer',
            },
          },
          null,
          2,
        ).replace(/"ArrayBuffer"/g, 'ArrayBuffer')
      } else if (step === 6) {
        const params = {
          id: this.credentials.id,
          attestationObject: base64url(this.credentials.response.attestationObject),
          clientDataJSON: base64url(this.credentials.response.clientDataJSON),
        }
        this.params6 = JSON.stringify(params, null, 2)
        this.authentication = await axios
          .post('/api/attestation/register', params)
          .then(res => res.data)
          .catch(err => {
            // eslint-disable-next-line no-alert
            alert(err)
            throw new Error(err)
          })
      } else if (step === 7) {
        this.params7 = JSON.stringify(
          { clientDataJSON: this.authentication.clientDataJSON },
          null,
          2,
        )
      } else if (step === 8) {
        this.params8 = 'SELECT userId FROM challenge WHERE challenge = {clientDataJSON.challenge}'
      } else if (step === 10) {
        this.params10 = JSON.stringify(
          { attestationObject: this.authentication.attestationObject },
          null,
          2,
        ).replace(/"ArrayBuffer"/g, 'ArrayBuffer')
      } else if (step === 11) {
        this.params11 = JSON.stringify(
          {
            attestationObject: {
              authData: this.authentication.authData,
            },
          },
          null,
          2,
        ).replace(/"ArrayBuffer"/g, 'ArrayBuffer')
      } else if (step === 12) {
        this.params12 = JSON.stringify(
          {
            credentialPublicKey: this.authentication.credentialPublicKey,
          },
          null,
          2,
        ).replace(/"ArrayBuffer"/g, 'ArrayBuffer')
      } else if (step === 13) {
        this.params13 = `attestationObject.attStmt.sig <ArrayBuffer> verificate by attestationObject.authData.credentialPublicKey <JWK encode PEM>.
Same result as authenticatorData <ArrayBuffer> + clientDataJSON <encode sha256>`
      } else if (step === 16) {
        this.params16 = JSON.stringify(
          {
            userId: this.userId,
            id: this.credentials.id,
            jwk: this.authentication.credentialPublicKey,
            signCount: this.authentication.authData.signCount,
          },
          null,
          2,
        )
      } else if (step === 17) {
        this.params17 = JSON.stringify({ status: 'OK' }, null, 2)
      }
    },
  },
}
</script>
<style lang="stylus" scoped>
ul
  padding-left 20px

code
  white-space pre-wrap
  word-break break-all
</style>
