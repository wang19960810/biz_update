<script setup lang="ts">
import {reactive, ref, onMounted} from "vue"
import { useRouter } from 'vue-router'
import {useServeStore} from "@src/store/serveStoreState.ts";
import type {FormInstance, FormRules} from 'element-plus'
import type {Serve} from '../../../types'

const serveStore = useServeStore()

const router = useRouter()

// 表单实例
const ruleFormRef = ref<FormInstance>()

onMounted(() => {
  setTimeout(() => { // 转为异步 等父组件从本地缓存读取完再执行赋值
    if (serveStore.serveInfo) {
      ruleForm.value = serveStore.serveInfo
    }
  }, 0)
})

// 表单数据
const ruleForm = reactive<{ value: Serve }>({
  value: {
    testUrl: "http://bz1.sxg2017.com:8200",
    testJwt: "eyJ6aXAiOiJHWklQIiwia2lkIjoiYWRtaW4iLCJ0eXAiOiJ1IiwidGVuYW50Q29kZSI6ImRlZmF1bHQiLCJhbGciOiJIUzUxMiIsInR0bCI6MH0.H4sIAAAAAAAAAG2Qu07DMBSG3-XMGWxClcuGYOlAxYCEFFQhK3bSSM5x5NiCqurGZYWNlYmNkYE-DwqPURuHlqGe7O9Y___prMD2QjdYKchXoHQ9Y62AHH4-H4av9-HjbXh-_H55HTb3w-YJIpCqbvBy2bk_NALVCZxyyNFK6WYMa8tq8ffWSopTxUUP-TWcnJ1PZzCPwAhkaDx3NVxUzErjgr3GCFNCCI0d04LJwz5u2LG-v1V6196p3uzaiivye2jiKyut2uAcvjZcoGnMMjCwPm2h0N9pEh_TJEtTkjnq9jE6FUUIPEogVB32uqFuXC4aybXAi39G872gT9vrRcDKUlk0DjPeNjjuAkN-QOsIxF3nVp5MYpLGE5Ktt5CIEne5AQAA.Asavfxm_7Qi8KffJ-NGRI8ZVTdYATfyMiWs89SMsv-uDSszKDxGthn-AptpQwTo5GlCMT6E7NWZ0DxpKfhBRlQ",
    prodUrl: "https://crm-prod.sxg2017.com:18088",
    prodJwt: "eyJ6aXAiOiJHWklQIiwia2lkIjoiYWRtaW4iLCJ0eXAiOiJ1IiwidGVuYW50Q29kZSI6ImRlZmF1bHQiLCJhbGciOiJIUzUxMiIsInR0bCI6MH0.H4sIAAAAAAAAAG2QTUvDQBCG_8ucc0gqNZibKEgPFkFBUYoszSYNbGbDZoOW0otQQVCsNwuC9NSLWD34gUH8M82H_8KNqW0O7mnmnZ33fZgeRCEVHjocrB5w4TaJT8GC9GWUPt8n069ZPMqf3pLLOL-a5mfjWfyZ3l18j4bJ4CG5fgcNGHc93OsGasvQgAcUGzZYGDGmZgTdiLj0rxec0Q1u0xCsI1jf3G40oaWBpEhQFroKtqlDIiaVcQE2F3cPtnTd0Gs1JQtK2Bwyfx1kH5PscZwNz5ObWzUMSBiecLEACHgoF4GH-_rvM8wi1RHcL7HLr55NUXqyW2oQFW4djkVNbN9D1avzLIGgdP8f5dhQ43bHY7aguFOBaC2Z1FaFSAPSbvMIZSWvuACW_qXU14CeBurQZn1FX9Pr5mr_B_3xnvzBAQAA.1s5rAmHlPD33RHiD0-3Q0ggNjMvvh3Ilfgxnasl6EmL71uORYSUBaI9ZDBZ03E3Fwmf6ub5L9CcktvygfLUhYA",
  }
})

// 表单验证
const rules = reactive<{ value: FormRules<Serve> }>({
  value: {
    testUrl: [
      {required: true, message: '请输入测式域名/ip', trigger: 'blur'},
    ],
    testJwt: [
      {required: true, message: '请输入测式Jwt', trigger: 'blur'},
    ],
    prodUrl: [
      {required: true, message: '请输入正式域名/ip', trigger: 'blur'},
    ],
    prodJwt: [
      {required: true, message: '请输入正式Jwt', trigger: 'blur'},
    ],
  }
})

/**
 * 表单提交
 * @param formEl
 */
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      console.log('submit!')
      serveStore.serveInfo = ruleForm.value
      localStorage.setItem('serveInfo', JSON.stringify(serveStore.serveInfo))
      router.push("/report")
    } else {
      console.log('error submit!', fields)
    }
  })
}
</script>

<template>
  <div class="home_page">
    <el-form ref="ruleFormRef"
             :model="ruleForm.value"
             :rules="rules.value"
             label-width="120">
      <div class="container">
        <div class="card">
          <div class="card-title">测试登录</div>
          <div>
            <el-form-item class="in-1" label="ip/域名" prop="testUrl">
              <el-input v-model="ruleForm.value.testUrl"/>
            </el-form-item>
            <el-form-item class="in-2" label="Jwt" prop="testJwt">
              <el-input type="textarea" :rows="14" v-model="ruleForm.value.testJwt"/>
            </el-form-item>
          </div>
        </div>
        <div class="card">
          <div class="card-title">正式登录</div>
          <div>
            <el-form-item class="in-1" label="ip/域名" prop="prodUrl">
              <el-input v-model="ruleForm.value.prodUrl"/>
            </el-form-item>
            <el-form-item class="in-2" label="Jwt" prop="prodJwt">
              <el-input type="textarea" :rows="14" v-model="ruleForm.value.prodJwt"/>
            </el-form-item>
          </div>
          <el-button type="primary" class="card-button in-3" @click="submitForm(ruleFormRef)">保存</el-button>
        </div>
      </div>
    </el-form>
  </div>
</template>

<style scoped lang="less">
.home_page {
  width: 100%;
  min-height: 100vh;
  background-color: rgba(0, 0, 0, 0.1);
  background-image: url("../../../assets/home.webp");
  background-repeat: no-repeat;
  background-size: cover;
  background-blend-mode: multiply;
  overflow: hidden;
}


.container {
  width: 70%;
  margin: 0 auto;
  padding-top: 25vh;
  display: flex;
  justify-content: space-between;
}

.card {
  padding: 2em;
  position: relative;
  width: 48%;
  background-color: rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #ffffff94;
}

.card-button {
  position: absolute;
  bottom: 6px;
  right: 2em;
  text-align: right;
}

.card-title {
  width: 100%;
  position: absolute;
  top: 6px;
  left: 0;
  color: var(--primary-color);
  font-size: 26px;
  text-align: center;
  font-weight: 600;
  font-family: "Agency FB",serif;
  opacity: 0;
  animation: reloadBase 1s ease-out forwards;
  animation-delay: 0.2s;
}

.in-1 {
  opacity: 0;
  animation: reloadBase 1.2s ease-out forwards;
  animation-delay: 0.2s;
}

.in-2 {
  opacity: 0;
  animation: reloadBase 1s ease-out forwards;
  animation-delay: 0.4s;
}

.in-3 {
  opacity: 0;
  animation: reloadBase 1s ease-out forwards;
  animation-delay: 0.5s;
}

/deep/ .el-form-item {
  flex-direction: column;
  align-items: flex-start;

  label {
    display: block;
    width: 100%;
    text-align: left;
    color: var(--primary-color);
  }

  > .el-form-item__content {
    width: 100%;
  }
}



</style>

<style>
@keyframes reloadBase {
  from {
    transform: translateY(250px);
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>