<template>
  <v-card class="ma-0 mr-2 mb-2" max-width="160">
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title
          class="body-2"
        >{{ getDateString(galleryEntry) }} (GMT {{ -timezoneOffset >= 0 ? '+' : '-' }}{{ -timezoneOffset }})</v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <img v-if="activeImage !== null" :src="activeImage" />
    <v-card-text v-else>File is not ready yet...</v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>mdi-download</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
<script>
import { nf } from '../utilities/helpers'
import { mapActions } from 'vuex'

export default {
  interval: null,
  props: {
    galleryEntry: Object,
  },
  data: () => ({
    thumbs: [],
    images: [],
    activeImage: null,
    timezoneOffset: new Date().getTimezoneOffset() / 60,
  }),
  watch: {
    thumbs: function(newThumbs) {
      clearInterval(this.interval)
      for (const thumb of newThumbs) {
        const buffer = new Uint8Array(thumb)
        const blob = new Blob([buffer], { type: 'image/png' })
        const imageUrl = URL.createObjectURL(blob)
        this.images.push(imageUrl)
      }

      if (this.images.length > 0) {
        this.activeImage = this.images[0]
        setInterval(() => {
          let currentIndex = this.images.findIndex(img => img === this.activeImage)
          currentIndex++
          if (currentIndex > this.images.length - 1) currentIndex = 0
          this.activeImage = this.images[currentIndex]
        }, 1000 + Math.random() * 100) // lets slide images slightly different from each other
      }
    },
  },
  methods: {
    ...mapActions(['getThumbs', 'showSnackbar']),
    getDateString(item) {
      const date = new Date(item.id)
      return `${nf(date.getHours())}:${nf(date.getMinutes())}:${nf(date.getSeconds())}`
    },
    async getThumbnails(fileId) {
      try {
        this.thumbs = await this.getThumbs(fileId)
      } catch (err) {
        console.error('getThumbnails error:', err)
        this.showSnackbar({
          text: err,
          timeout: 10000,
        })
      }
    },
  },
  created: function() {
    // if state "thumbnails ready"
    if (this.galleryEntry.state === 2) this.getThumbnails(this.galleryEntry.id)
  },
  beforeDestroy() {
    if (this.interval) clearInterval(this.interval)
    if (this.images.length !== 0) this.images.forEach(url => URL.revokeObjectURL(url))
  },
}
</script>