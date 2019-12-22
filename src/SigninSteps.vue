<template>
  <main>
    <Step
      title="Request Challenge API"
      type="client"
      :index="1"
      :step="step"
      @next="next"
    >
      <p>POST /api/assertion/challenge</p>
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
      :title="`Request Credentials Get`"
      type="client"
      :index="4"
      :step="step"
      @next="next"
    >
      <p>navigator.credentials.get()</p>
      <p><code>{{ params4 }}</code></p>
    </Step>
    <Step
      :title="`Response Credentials Get`"
      type="client"
      :index="5"
      :step="step"
      @next="next"
    >
      <p><code>{{ params5 }}</code></p>
    </Step>
    <Step
      title="Request Verify API"
      type="client"
      :index="6"
      :step="step"
      @next="next"
    >
      <p>POST /api/assertion/verify</p>
      <p>* authenticatorData, clientDataJSON and signature encode base64</p>
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
      title="Decode authenticatorData from base64 and parse ArrayBuffer"
      type="server"
      :index="10"
      :step="step"
      @next="next"
    >
      <p><code>{{ params10 }}</code></p>
    </Step>
    <Step
      title="Verify RPID Hash"
      type="server"
      :index="11"
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
      :index="12"
      :step="step"
      @next="next"
    >
      <ul>
        <li>Flags UP Match<br><code>Boolean(flags & 0x01)</code></li>
        <li>Flags UV Match<br><code>Boolean(flags & 0x04)</code></li>
      </ul>
    </Step>
    <Step
      title="Collate Credential Database and Fetch data"
      type="server"
      :index="13"
      :step="step"
      @next="next"
    >
      <p><code>{{ params13 }}</code></p>
    </Step>
    <Step
      title="Signature Verification"
      type="server"
      :index="14"
      :step="step"
      @next="next"
    >
      <p>* see details <a href="https://www.w3.org/TR/webauthn/#fig-signature">Generating an assertion signature</a></p>
      <p><code>{{ params14 }}</code></p>
    </Step>
    <Step
      title="signCount Verification"
      type="server"
      :index="15"
      :step="step"
      @next="next"
    >
      <p><code>{{ params15 }}</code></p>
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
      title="Response Verify API"
      type="server"
      :index="17"
      :step="step"
      @next="next"
    >
      <p><code>{{ params17 }}</code></p>
    </Step>
  </main>
</template>
<script>
import axios from 'axios'
import base64url from 'base64url'
import { makeGetPublicKey, rpId, origin } from './utils'
import Step from './Step.vue'

export default {
  name: 'SigninSteps',
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
      credentialId: '',
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
        const data = await axios
          .post('/api/assertion/challenge', { userId: this.userId })
          .then(res => res.data)
          .catch(err => {
            // eslint-disable-next-line no-alert
            alert(err)
            throw new Error(err)
          })
        const { challenge, credentialId } = data
        this.challenge = challenge
        this.credentialId = credentialId
        this.params2 = JSON.stringify({ challenge: this.challenge, userId: this.userId }, null, 2)
      } else if (step === 3) {
        this.params3 = JSON.stringify(
          {
            challenge: this.challenge,
            credentialId: this.credentialId,
          },
          null,
          2,
        )
      } else if (step === 4) {
        const publicKey = makeGetPublicKey({
          credentialId: this.credentialId,
          challenge: this.challenge,
        })
        this.params4 = JSON.stringify(publicKey, null, 2)
          .replace('"id": {}', `"id": "${this.credentialId}" -> ArrayBuffer`)
          .replace('"challenge": {}', `"challenge": "${this.challenge}" -> ArrayBuffer`)
        this.credentials = await navigator.credentials
          .get(publicKey)
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
              authenticatorData: 'ArrayBuffer',
              clientDataJSON: 'ArrayBuffer',
              signature: 'ArrayBuffer',
              userHandle: 'ArrayBuffer',
            },
          },
          null,
          2,
        ).replace(/"ArrayBuffer"/g, 'ArrayBuffer')
      } else if (step === 6) {
        const params = {
          authenticatorData: base64url(this.credentials.response.authenticatorData),
          clientDataJSON: base64url(this.credentials.response.clientDataJSON),
          signature: base64url(this.credentials.response.signature),
        }
        this.params6 = JSON.stringify(params, null, 2)
        this.authentication = await axios
          .post('/api/assertion/verify', params)
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
          {
            authenticatorData: {
              rpIdHash: 'ArrayBuffer',
              flags: this.authentication.authenticatorData.flags,
              signCount: this.authentication.authenticatorData.signCount,
            },
          },
          null,
          2,
        ).replace(/"ArrayBuffer"/g, 'ArrayBuffer')
      } else if (step === 13) {
        this.params13 = JSON.stringify(
          {
            credential: this.authentication.credential,
          },
          null,
          2,
        )
      } else if (step === 14) {
        this.params14 = `signature <ArrayBuffer> verificate by credential.jwk <JWK encode PEM>.
Same result as authenticatorData <ArrayBuffer> + clientDataJSON <encode sha256>`
      } else if (step === 15) {
        this.params15 = 'signCount !== 0 && signCount < assertion.signCount'
      } else if (step === 16) {
        // eslint-disable-next-line no-multi-spaces
        this.params16 =          'UPDATE assertion SET signCount = {assertion.signCount} WHERE userId = {userId}'
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
