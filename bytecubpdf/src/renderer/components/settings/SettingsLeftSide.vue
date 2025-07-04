<script lang="ts" setup>
defineOptions({
  name: 'SettingsLeftSide'
})
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const emit = defineEmits(['update:active'])
import { DataBase,IbmCloudPakSystem } from '@vicons/carbon'
import { NButton, NIcon,NFlex } from 'naive-ui'
const menuItems = [
  { key: 'storage', label: t('settings.leftside.buttons.system'), icon: DataBase },
  { key: 'model', label: t('settings.leftside.buttons.model'), icon: IbmCloudPakSystem },
]
const props = defineProps({
  active: {
    type: String,
    required: true
  }
})
const handleClick = (key: string) => {
  emit('update:active', key)
}
</script>

<template>
  <div style="margin-right: 13px">
    <n-flex vertical>
      <n-button 
        text
        :type="active === item.key ? 'primary' : 'default'"
        style="justify-content: start; padding-left: 12px"
        v-for="item in menuItems" 
        :key="item.key"
        @click="handleClick(item.key)"
      >
        <template #icon>
          <n-icon>
            <component :is="item.icon" />
          </n-icon>
        </template>
        {{ item.label }}
      </n-button>
    </n-flex>
  </div>
</template>