<template>
  <t-layout>
    <!-- 主体布局 -->
    <t-layout style="margin-top: 2px;">
      <!-- 侧边导航 -->
      <t-aside style="
        position: fixed;
        top: 48px;
        bottom: 0;
        width: 200px;
        overflow-y: auto;
        border-right: 1px solid #e8e8e8;
      ">
        <t-menu theme="light" :default-value="activeMenu" @change="handleMenuChange">
          <t-menu-item value="/">PDF翻译</t-menu-item>
          <t-menu-item value="/history">历史记录</t-menu-item>
          <t-menu-item value="/about">关于我们</t-menu-item>
          <t-menu-item value="/services">使用说明</t-menu-item>
          <t-menu-item value="/contact">联系我们</t-menu-item>
        </t-menu>
      </t-aside>

      <!-- 内容区域 -->
      <t-layout style="margin-left: 200px;">
        <t-content style="
          padding: 16px;
          min-height: calc(100vh - 96px);
          background: #fff;
        ">
          <router-view />
        </t-content>

        <!-- 页脚 -->
        <t-footer style="
          height: 48px;
          line-height: 48px;
          text-align: center;
          border-top: 1px solid #e8e8e8;
        ">
          <div class="footer">
            <p>© 2023 公司名称. 保留所有权利。</p>
          </div>
        </t-footer>
      </t-layout>
    </t-layout>
  </t-layout>
</template>

<script>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  name: 'GlobalLayout',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const activeMenu = ref(route.path);

    watch(
      () => route.path,
      (newPath) => {
        activeMenu.value = newPath;
      }
    );

    const handleMenuChange = (value) => {
      router.push(value);
    };

    return {
      activeMenu,
      handleMenuChange
    };
  }
};
</script>

<style scoped>
/* 全局隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
}

.t-layout {
  height: 100vh;
  overflow: hidden; /* 防止全局滚动 */
  background: #f5f5f5;
}

.t-aside {
  overflow-x: hidden; /* 隐藏横向滚动 */
  overflow-y: hidden; /* 隐藏纵向滚动 */
}

.t-menu {
  width: 100%; /* 确保菜单宽度与容器一致 */
}

.t-menu-item {
  padding: 0 20px;
  max-width: 200px; /* 限制菜单项最大宽度 */
  overflow: hidden;
  text-overflow: ellipsis; /* 文字过长显示省略号 */
  white-space: nowrap;
}

.t-content {
  /* 调整高度计算 */
  height: calc(100vh - 144px); /* 根据实际header和footer高度调整 */
  overflow: hidden; /* 隐藏内容溢出 */
}

.t-footer {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 200px; /* 与侧边栏宽度一致 */
}
</style>