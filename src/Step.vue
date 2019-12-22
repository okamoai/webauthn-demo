<template>
  <section
    v-show="isShow"
    :class="type"
  >
    <h2>Step {{ index }}. {{ title }}</h2>
    <slot />
    <button
      v-show="isButtonShow"
      type="button"
      @click="$emit('next', index + 1)"
    >
      ▼
    </button>
  </section>
</template>
<script>
export default {
  name: 'Step',
  props: {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'client',
    },
    step: {
      type: Number,
      default: 0,
    },
    index: {
      type: Number,
      default: 1,
    },
  },
  computed: {
    isShow() {
      return this.index <= this.step
    },
    isButtonShow() {
      return this.index === this.step
    },
  },
}
</script>
<style lang="stylus" scoped>
section
  border 1px solid #999
  background #eee
  box-shadow 0 2px 4px rgba(0, 0, 0, .4)
  padding 8px
  background-color #fc0
  position relative

  &::before
    content 'Clinet'
    display block
    position absolute
    top 4px
    right 4px
    color #999

  &.server
    background-color #fcf

    &::before
      content 'Server'

button
  position absolute
  right 8px
  bottom 8px
  border 1px solid #666
  border-radius 2px
  background #fff
  padding 4px 8px
  margin-left 4px
</style>
