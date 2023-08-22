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
                <v-file-input label="Выбрать медиа" accept="image/png, image/jpeg, image/jpg, image/JPG, image/JPEG, video/mp4" variant="underlined" hide-details multiple class="mb-4" @update:model-value="changeItems"/>
              </div>
              <v-btn width="100%" color="primary" class="mt-auto" :disabled="!items.length || !secretString" @click="encrypt">Зашифровать</v-btn>
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
        <template v-if="items.length">
          <div v-if="false" class="d-flex justify-center mt-4 mb-4">
            <v-btn width="100%" color="white" variant="text">Скачать всё</v-btn>
          </div>
          <v-row>
            <v-col class="d-flex justify-center">
              <div v-for="(column, columnIndex) in columns" :key="columnIndex">
                <v-card v-for="(item, itemIndex) in column" :key="itemIndex" class="pa-2 item-card align-self-start d-flex flex-column bg-white h-auto ma-2 position-relative">
                  <img v-if="checkForImage(item)" class="media" :src="item" alt="">
                  <video v-else class="media" controls :src="item"/>
                  <div class="position-absolute controls flex-grow-1 d-flex pa-2">
                    <v-btn icon color="primary" size="x-small" class="mr-2" @click="removeItem(item)">
                      <v-icon>
                        mdi-close
                      </v-icon>
                    </v-btn>
                    <v-btn v-if="false" icon color="primary" size="x-small">
                      <v-icon>
                        mdi-download
                      </v-icon>
                    </v-btn>
                  </div>
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
      items: [],
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
      if (!this.items.length) return []
      const groups = new Array(this.gap)
      let currentIndex = 0
      let counter = 0
      while (counter < this.items.length) {
        if (!groups[currentIndex]) groups[currentIndex] = []
        if (currentIndex === this.gap - 1) currentIndex = 0
        if (currentIndex < this.gap - 1) {
          groups[currentIndex].push(this.items[counter])
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
    async changeItems(items) {
      this.items = await Promise.all(items.map((itemFile) => getBase64(itemFile)))
    },

    async encrypt() {
      const promises = this.items.map(async (item) => await CryptoJS.AES.encrypt(item, this.secretString).toString())
      this.encryptString = await Promise.all(promises).then((r) => r.join(separator))
    },

    async decrypt() {
      const rawItems = this.encryptString.split(separator)
      this.items = await Promise.all(rawItems.map(async (item) => await CryptoJS.AES.decrypt(item, this.secretString).toString(CryptoJS.enc.Utf8)))
    },

    copyResult() {
      copy(this.encryptString)
    },

    saveResult(path = 'secret.txt', fileContent = this.encryptString) {
      const zip = new JSZip();
      zip.file(path, fileContent);
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
    },

    checkForImage(item) {
      return item.includes('image')
    },


    getFormat(item, type = 'image') {
      return item.substring(`data:${type}/`.length, item.indexOf(";base64"))
    },

    removeItem(item) {
      const index = this.items.findIndex((el) => el === item)
      if (index !== undefined) this.items.splice(index, 1)
    },

    getFile(item) {
      const file = this.checkForImage(item) ? new Image() : new Video()
      file.src = item
      return file
    },

    getFilename(item) {
      const prefix = this.checkForImage(item) ? 'image' : 'video'
      const format = this.getFormat(item, prefix)
      return `${prefix}-${new Date().getTime()}.${format}`
    },

    downloadItem(item) {
      const filename = this.getFilename(item)
      this.saveResult(filename, this.getFile(item))
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
.media {
  max-width: 300px;
}

.item-card {
  .controls {
    opacity: 0;
  }
  &:hover {
    .controls {
      opacity: 1;
    }
  }
}
</style>
