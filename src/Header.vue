<template>
  <header>
    <span class="userId">
      ID:
      <input
        v-model="userId"
        type="email"
        required
      >
    </span>
    <button
      type="button"
      @click="$emit('signUp', userId)"
    >
      Sign up
    </button>
    <button
      type="button"
      @click="$emit('signIn', userId)"
    >
      Sign in
    </button>
  </header>
</template>
<script>
export default {
  name: 'Header',
  data() {
    return {
      userId: 'example@example.com',
    }
  },
}
</script>
<style lang="stylus" scoped>
header
  display flex
  background #eee
  box-shadow 0 2px 4px rgba(0, 0, 0, .4)
  padding 8px
  position relative
  z-index 2

.userId
  flex 1

  input
    border 1px solid #999
    border-radius 4px
    background #fff
    padding 4px

button
  border 1px solid #666
  border-radius 2px
  background #fff
  padding 4px 8px
  margin-left 4px
</style>
