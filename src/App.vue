<template>
  <div id="app">
    <template v-if="disableWebauthn">
      <p class="notSupported">
        WebAuthn is not supoprted.
      </p>
    </template>
    <template v-else>
      <Header
        @signUp="userId => signUp(userId)"
        @signIn="userId => signIn(userId)"
      />
      <SignupSteps
        v-if="actionType === 'signUp'"
        :user-id="userId"
      />
      <SigninSteps
        v-if="actionType === 'signIn'"
        :user-id="userId"
      />
    </template>
  </div>
</template>

<script>
import Header from './Header.vue'
import SignupSteps from './SignupSteps.vue'
import SigninSteps from './SigninSteps.vue'

export default {
  name: 'App',
  components: {
    Header,
    SignupSteps,
    SigninSteps,
  },
  data() {
    return {
      disableWebauthn: typeof window.PublicKeyCredential === 'undefined',
      actionType: '',
      userId: '',
    }
  },
  methods: {
    signUp(userId) {
      this.userId = userId
      this.actionType = 'signUp'
    },
    signIn(userId) {
      this.userId = userId
      this.actionType = 'signIn'
    },
  },
}
</script>
<style lang="stylus" scoped>
#app
  display grid
  height 100vh
  grid-template-rows auto 1fr

.notSupported
  display flex
  justify-content center
  align-items center
  height 100vh
</style>
