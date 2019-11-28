<template>
  <div class="pa-5">This is Settings page</div>
</template>

<script>
import { mapMutations } from 'vuex'
export default {
  methods: mapMutations(['setTitle']),
  created() {
    this.setTitle('Settings')
  },
}
</script>
