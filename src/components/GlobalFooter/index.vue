<template>
  <global-footer class="footer custom-render">
    <template v-slot:links>
      <a href="https://www.github.com/sendya/" target="_blank">颐点科技</a>
    </template>
    <template v-slot:copyright>
    </template>
  </global-footer>
</template>

<script>
import { GlobalFooter } from '@ant-design-vue/pro-layout'

export default {
  name: 'ProGlobalFooter',
  components: {
    GlobalFooter
  }
}
</script>
