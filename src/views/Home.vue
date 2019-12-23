<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <v-col class="pa-0" cols="12" md="8">
        <v-card id="videCard" ref="videoCard">
          <!-- Author of the background image: https://pixabay.com/vectors/dog-cat-animal-pet-cute-1517090/ Thank you! -->
          <canvas id="videoCanvas" ref="videoCanvas"></canvas>
          <v-card-actions class="d-flex justify-center">
            <v-btn
              :disabled="!connected || receivingPhotoBuffer"
              :loading="videoBtnLoading"
              @click="videoPlaying ? stopVideo() : startVideo()"
            >
              <v-icon left>{{ videoPlaying ? 'mdi-stop' : 'mdi-play' }}</v-icon>video
            </v-btn>
            <v-btn :disabled="!connected" :loading="feedBtnLoading" @click="feed">Feed me!</v-btn>
            <v-btn
              :disabled="!connected || videoPlaying || receivingPhotoBuffer"
              :loading="photoBtnLoading"
              @click="takePhoto"
            >
              <v-icon left>mdi-camera</v-icon>Photo
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import backImageUrl from '../assets/camera_back.png'
import Broadway from 'broadway-player'
import { Base64 } from 'js-base64'

export default {
  canvasCtx: null,
  player: null,
  backImage: null,
  photoBuffer: null, // TODO: timeout needed if something will crash while we receiving jpeg buffer
  photoImage: null,
  data: () => ({
    videoPlaying: false,
    videoBtnLoading: false,
    feedBtnLoading: false,
    photoBtnLoading: false,
    receivingPhotoBuffer: false,
  }),
  computed: {
    ...mapState(['connected']),
  },
  watch: {
    connected: function(newVal) {
      if (newVal === false && this.videoPlaying) {
        this.videoPlaying = false
        this.drawBackImage()
      }
    },
  },
  methods: {
    ...mapMutations(['setTitle']),
    ...mapActions(['showSnackbar']),
    decodeVideo(event) {
      if (event.e !== 'camera/h264data') return
      if (!this.videoPlaying) return
      const nalPrefix = new Uint8Array([0, 0, 0, 1]) // Adding NAL Unit header
      const buffer = new Uint8Array(event.d)
      const concat = new Uint8Array(nalPrefix.length + buffer.length)
      concat.set(nalPrefix)
      concat.set(buffer, nalPrefix.length)
      this.player.decode(concat)
    },
    decodePicture(event) {
      if (event.e !== 'camera/picturedata') return

      if (!event.d) {
        this.receivingPhotoBuffer = false
        //const objUrl = 'data:image/jpeg;base64,' + Base64.btoa(String.fromCharCode(...this.photoBuffer)) // throws maximum call stack exceeded on IOS
        let objUrl = ''
        try {
          objUrl =
            'data:image/jpeg;base64,' +
            Base64.btoa(this.photoBuffer.reduce((data, byte) => data + String.fromCharCode(byte), ''))
        } catch (err) {
          console.error('Error creating image URL:', err)
          this.$store.dispatch('showSnackbar', {
            text: 'Unable to create image URL',
            timeout: 10000,
          })
          this.photoBuffer = null
          return
        }

        this.photoBuffer = null
        this.photoImage = new Image()
        this.photoImage.onload = () => this.drawBackImage()
        this.photoImage.onerror = err => {
          console.error('Error decoding image:', err)
          this.$store.dispatch('showSnackbar', {
            text: 'Unable to decode image',
            timeout: 10000,
          })
        }

        this.photoImage.src = objUrl
        return
      }

      const buffer = new Uint8Array(event.d)

      if (!this.photoBuffer) {
        this.photoBuffer = buffer
      } else {
        const concat = new Uint8Array(this.photoBuffer.length + buffer.length)
        concat.set(this.photoBuffer)
        concat.set(buffer, this.photoBuffer.length)
        this.photoBuffer = concat
      }
    },
    onDecoded(buffer, width, height) {
      if (!this.videoPlaying) return
      if (this.canvasCtx.busy) {
        console.info('Skipping frame')
        return // frame skipping if still drawing on 2d canvas
      }

      this.canvasCtx.busy = true
      // rescaling and redrawing on 2d canvas
      this.canvasCtx.drawImage(
        this.player.canvas, // image
        0, // source image from Y
        0, // source image from X
        width, // source image width
        height, // source image height
        0, // destination Y
        0, // destination X
        this.canvasCtx.canvas.width, // destination width
        this.canvasCtx.canvas.height // destination height
      )

      this.canvasCtx.busy = false
    },
    async startVideo() {
      this.photoImage = null
      try {
        this.videoBtnLoading = true
        this.$store.socket.off('notification', this.decodeVideo)
        this.$store.socket.on('notification', this.decodeVideo)
        await this.$store.dispatch('startVideo')
        this.videoPlaying = true
      } catch (err) {
        console.error('startVideo error:', err)
        this.$store.socket.off('notification', this.decodeVideo)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }

      this.videoBtnLoading = false
    },
    async stopVideo() {
      try {
        this.videoBtnLoading = true
        this.$store.socket.off('notification', this.decodeVideo)
        await this.$store.dispatch('stopVideo')
      } catch (err) {
        console.error('stopVideo error:', err)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }

      this.videoPlaying = false
      this.videoBtnLoading = false
      this.canvasCtx.clearRect(0, 0, this.canvasCtx.canvas.width, this.canvasCtx.canvas.height)
      this.drawBackImage()
    },
    async feed() {
      try {
        this.feedBtnLoading = true
        await this.$store.dispatch('feedManually')
      } catch (err) {
        console.error('feed error:', err)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }

      this.feedBtnLoading = false
    },
    async takePhoto() {
      try {
        this.photoBtnLoading = true
        this.$store.socket.off('notification', this.decodePicture)
        this.$store.socket.on('notification', this.decodePicture)
        await this.$store.dispatch('takePicture')
        this.receivingPhotoBuffer = true
      } catch (err) {
        console.error('takePhoto error:', err)
        this.$store.socket.off('notification', this.decodePicture)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }

      this.photoBtnLoading = false
    },
    resizeCanvas() {
      const canvas = this.$refs.videoCanvas
      const card = this.$refs.videoCard.$el

      canvas.height = card.clientWidth / 1.33 // 4/3 aspect ratio
      canvas.width = card.clientWidth
    },
    drawBackImage() {
      const image = this.photoImage || this.backImage
      this.canvasCtx.drawImage(
        image, // image to draw
        0, // source image from Y
        0, // source image from X
        image.width, // source image width
        image.height, // source image height
        0, // destination Y
        0, // destination X
        this.canvasCtx.canvas.width, // destination width
        this.canvasCtx.canvas.height // destination height
      )
    },
    onWindowResize() {
      this.resizeCanvas()
      if (!this.videoPlaying) this.drawBackImage()
    },
  },
  created() {
    this.setTitle('Smart Pet Feeder')
    this.player = new Broadway.Player({
      useWorker: true,
      size: {
        width: 640,
        height: 480,
      },
    })

    this.player.onPictureDecoded = this.onDecoded
  },
  mounted() {
    // when component mounted and elements added to the DOM
    this.$nextTick(() => {
      this.canvasCtx = this.$refs.videoCanvas.getContext('2d')
      const backImage = new Image()
      backImage.onload = () => {
        this.backImage = backImage
        this.resizeCanvas()
        this.drawBackImage()
      }

      window.addEventListener('resize', this.onWindowResize)
      backImage.src = backImageUrl // loading background image
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowResize)
    this.videoPlaying && this.stopVideo()
    this.$store.socket.off('notification', this.decodeVideo)
    this.$store.socket.off('notification', this.decodePicture)
  },
}
</script>
