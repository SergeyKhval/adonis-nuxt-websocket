<template>
  <div>
    <nuxt/>
  </div>
</template>

<script>
  import Socketable from '../mixins/socketable'

  export default {
    mixins: [Socketable],
  }
</script>
