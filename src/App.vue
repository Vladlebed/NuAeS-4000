<template>
  <v-app>
    <v-main class="bg-primary">
      <v-container ref="container">
        <v-row>
          <v-col>
            <v-card color="white" class="pa-4">
              <v-text-field v-model.trim="secretString" label="Cекретное слово" hide-details @update:model-value="updateSecret"/>
              <v-checkbox v-model="allowSaveSecret" color="primary" label="Сохранить в памяти браузера" hide-details @update:model-value="changeAllowSaveSecret"/>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col xl="6" md="12">
            <v-card color="white" class="pa-4 d-flex flex-column fill-height">
              <div class="flex-grow-1">
                <v-card-title>Ввод</v-card-title>
                <v-file-input label="Выбрать фото" accept="image/png, image/jpeg, image/jpg, image/JPG, image/JPEG" variant="underlined" hide-details multiple class="mb-4" @update:model-value="changePhotos"/>
              </div>
              <v-btn width="100%" color="primary" class="mt-auto" :disabled="!photos.length || !secretString" @click="encrypt">Зашифровать</v-btn>
            </v-card>
          </v-col>
          <v-col xl="6" md="12">
            <v-card color="white" class="pa-4 fill-height">
              <v-card-title>Вывод</v-card-title>
              <div>
                <div>
                  <v-textarea v-if="isResultView" v-model="encryptString" variant="underlined" label="Шифрованная строка" hide-details class="mb-4"/>
                  <v-checkbox v-model="isResultView" :label="isResultView ? 'Скрыть вывод' : 'Показать вывод'"/>
                  <v-row align="center">
                    <v-col xl="8" md="12">
                      <v-btn color="primary" :disabled="!encryptString" class="mr-4" @click="copyResult">Скопировать</v-btn>
                      <v-btn color="primary" :disabled="!encryptString" @click="saveResult">Скачать</v-btn>
                    </v-col>
                    <v-col xl="4" md="12">
                      <v-file-input label="Загрузить архив" accept=".zip" variant="underlined" hide-details @update:model-value="putArchive"/>
                    </v-col>
                  </v-row>
                </div>
                <v-btn width="100%" color="primary" class="mt-4" :disabled="!encryptString || !secretString" @click="decrypt">Расшифровать</v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
        <template v-if="photos.length">
          <div class="d-flex justify-center mt-4 mb-4">
            <v-btn width="100%" color="white" variant="text">Скачать всё</v-btn>
          </div>
          <v-row>
            <v-col class="d-flex justify-center">
              <div v-for="(column, columnIndex) in columns" :key="columnIndex">
                <v-card v-for="photo in column" class="pa-2 photo-card align-self-start d-flex flex-column bg-white h-auto ma-2">
                  <img class="photo" :src="photo" alt="">
                </v-card>
              </div>
            </v-col>
          </v-row>
        </template>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import {getBase64} from "@/helpers";
import copy from 'copy-to-clipboard'
import JSZip from 'jszip';
import FileSaver from 'file-saver';

const CryptoJS = require("crypto-js")
const separator = '*-*'

export default {
  data() {
    return {
      photos: [],
      secretString: '',
      encryptString: '',
      allowSaveSecret: false,
      isResultView: false,
      containerWidth: 1,
    }
  },

  computed: {
    gap() {
      return Math.ceil(this.containerWidth / 316)
    },

    columns() {
      if (!this.photos.length) return []
      const groups = new Array(this.gap)
      let currentIndex = 0
      let counter = 0
      while (counter < this.photos.length) {
        if (!groups[currentIndex]) groups[currentIndex] = []
        if (currentIndex === this.gap - 1) currentIndex = 0
        if (currentIndex < this.gap - 1) {
          groups[currentIndex].push(this.photos[counter])
        }
        counter++
        currentIndex++
      }
      return groups
    },
  },

  mounted() {
    this.containerWidth = this.$refs.container.$el.clientWidth
  },

  methods: {
    async changePhotos(photos) {
      this.photos = await Promise.all(photos.map((photoFile) => getBase64(photoFile)))
    },

    async encrypt() {
      const promises = this.photos.map(async (photo) => await CryptoJS.AES.encrypt(photo, this.secretString).toString())
      this.encryptString = await Promise.all(promises).then((r) => r.join(separator))
    },

    async decrypt() {
      const rawPhotos = this.encryptString.split(separator)
      this.photos = await Promise.all(rawPhotos.map(async (photo) => await CryptoJS.AES.decrypt(photo, this.secretString).toString(CryptoJS.enc.Utf8)))
      console.log('rawPhotos', rawPhotos)
    },

    copyResult() {
      copy(this.encryptString)
    },

    saveResult() {
      const zip = new JSZip();
      zip.file('secret.txt', this.encryptString);
      zip.generateAsync({ type: 'blob' }).then(function (content) {
        FileSaver.saveAs(content, 'download.zip');
      });
    },

    putArchive([archive]) {
      const newZip = new JSZip();

      newZip.loadAsync(archive)
        .then((zip) => {
          zip.file("secret.txt").async("string").then((r) => {
            this.encryptString = r
            if (this.secretString) {
              this.decrypt()
            }
          })
        });
    },

    updateSecret(secret) {
      if(this.allowSaveSecret) localStorage.setItem('secret', secret)
    },

    changeAllowSaveSecret(isAllow) {
      localStorage.setItem('allowSaveSecret', isAllow ? '1' : '0')
      if (!isAllow) localStorage.removeItem('secret')
      else {
        this.updateSecret(this.secretString)
      }
    }
  },

  created() {
    this.allowSaveSecret = !!+localStorage.getItem('allowSaveSecret')
    const secret = localStorage.getItem('secret')
    if (this.allowSaveSecret && secret) this.secretString = secret
  },
}
</script>

<style lang="scss">
.photo {
  max-width: 300px;

}
</style>
