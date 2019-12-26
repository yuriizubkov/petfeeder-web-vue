<template>
  <v-card class="ma-0 mr-2 mb-2 text-center" max-width="160">
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title
          class="body-2"
        >{{ getDateString(galleryEntry) }} (GMT {{ -timezoneOffset >= 0 ? '+' : '-' }}{{ -timezoneOffset }})</v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <img v-if="activeImage !== null" :src="activeImage" />
    <v-progress-circular v-if="loadingThumbs" indeterminate></v-progress-circular>
    <v-card-text v-if="galleryEntry.state !== 2">Thumbnails are not ready yet...</v-card-text>

    <v-card-actions>
      <v-progress-linear
        v-if="downloadingFile"
        class="body-2"
        v-model="downloadProgress"
        height="25"
        rounded
      >
        <template v-slot="{ value }">
          <strong>{{ value }}%</strong>
        </template>
      </v-progress-linear>
      <v-spacer></v-spacer>
      <v-btn
        v-if="!iOS"
        @click="downloadFile"
        :disabled="galleryEntry.state < 1 || downloadingFile"
        :loading="downloadingFile"
        icon
      >
        <v-icon>mdi-download</v-icon>
      </v-btn>
      <v-btn :disabled="galleryEntry.state !== 2 || downloadingFile" icon>
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
  videoFileBuffer: null,
  props: {
    galleryEntry: Object,
  },
  data: () => ({
    iOS: !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform), // download does not work on ios anyhow
    loadingThumbs: false,
    downloadingFile: false,
    fileSize: 0,
    bytesDownloaded: 0,
    thumbs: [],
    images: [],
    activeImage: null,
    timezoneOffset: new Date().getTimezoneOffset() / 60,
  }),
  computed: {
    downloadProgress: function() {
      return Math.ceil((this.bytesDownloaded / this.fileSize) * 100)
    },
  },
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
    ...mapActions(['getThumbs', 'showSnackbar', 'getVideoFile']),
    getDateString(item) {
      const date = new Date(item.id)
      return `${nf(date.getHours())}:${nf(date.getMinutes())}:${nf(date.getSeconds())}`
    },
    async getThumbnails(fileId) {
      this.loadingThumbs = true

      try {
        this.thumbs = await this.getThumbs(fileId)
      } catch (err) {
        console.error('getThumbnails error:', err)
        this.showSnackbar({
          text: err,
          timeout: 10000,
        })
      }

      this.loadingThumbs = false
    },
    onFileData(event) {
      if (event.e !== 'files/filedata') return
      if (!event.d) return
      if (event.d.fId !== this.galleryEntry.id) return

      if (event.d.d === null) {
        this.downloadingFile = false

        const blob = new Blob([this.videoFileBuffer], { type: 'octet/stream' })
        const url = URL.createObjectURL(blob)
        const fileDate = new Date(this.galleryEntry.id)
        const a = document.createElement('a')
        a.href = url
        a.download =
          `video-${fileDate.getUTCFullYear()}-` +
          `${nf(fileDate.getUTCMonth() + 1)}-` +
          `${nf(fileDate.getUTCDate())}-` +
          `${nf(fileDate.getUTCHours())}-` +
          `${nf(fileDate.getUTCMinutes())}-` +
          `${nf(fileDate.getUTCSeconds())}.mp4`
        a.click()

        setTimeout(() => {
          URL.revokeObjectURL(url) // destroy object url
        }, 1000)

        return
      }

      const buffer = new Uint8Array(event.d.d)
      this.bytesDownloaded += buffer.length

      if (!this.videoFileBuffer) this.videoFileBuffer = buffer
      else {
        const concat = new Uint8Array(this.videoFileBuffer.length + buffer.length)
        concat.set(this.videoFileBuffer)
        concat.set(buffer, this.videoFileBuffer.length)
        this.videoFileBuffer = concat
      }
    },
    async downloadFile() {
      this.fileSize = 0
      this.bytesDownloaded = 0
      this.downloadingFile = true
      this.$store.socket.off('notification', this.onFileData)

      try {
        this.fileSize = await this.getVideoFile(this.galleryEntry.id)
        this.$store.socket.on('notification', this.onFileData)
      } catch (err) {
        console.error('downloadFile error:', err)
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
    if (this.images.length !== 0) this.images.forEach(url => URL.revokeObjectURL(url)) // destroying thumbs
    this.$store.socket.off('notification', this.onFileData)
  },
}
</script>
