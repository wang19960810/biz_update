<script setup lang="ts">
import {reactive, ref, defineEmits, defineProps, onMounted} from "vue"
import { useServeStore} from "@src/store/serveStoreState.ts";
import type {FormInstance, FormRules} from 'element-plus'
import type { Serve } from '../../types'


const serveStore = useServeStore()

// 父组件函数
const emits = defineEmits(['submit'])

// 表单实例
const ruleFormRef = ref<FormInstance>()

onMounted(() => {
  setTimeout(() => { // 转为异步 等父组件从本地缓存读取完再执行赋值
    if( serveStore.serveInfo) {
      ruleForm.value =  serveStore.serveInfo
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
      emits('submit', ruleForm.value)
    } else {
      console.log('error submit!', fields)
    }
  })
}
</script>

<template>
  <div class="step1-page">
    <el-form ref="ruleFormRef"
             :model="ruleForm.value"
             :rules="rules.value"
             label-width="120">
      <div class="form-content">

        <div >
          <h3>测试</h3>
          <div>
            <el-form-item label="ip/域名" prop="testUrl">
              <el-input v-model="ruleForm.value.testUrl"/>
            </el-form-item>
            <el-form-item label="Jwt" prop="testJwt">
              <el-input type="textarea" :rows="12" v-model="ruleForm.value.testJwt"/>
            </el-form-item>
          </div>
        </div>
        <div>
          <h3>正式</h3>
          <div>
            <el-form-item label="ip/域名" prop="prodUrl">
              <el-input v-model="ruleForm.value.prodUrl"/>
            </el-form-item>
            <el-form-item label="Jwt" prop="prodJwt">
              <el-input type="textarea" :rows="12" v-model="ruleForm.value.prodJwt"/>
            </el-form-item>
          </div>
        </div>
      </div>
      <div style="margin-top: 20px;text-align: right">
        <el-button type="primary" @click="submitForm(ruleFormRef)">保存</el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped lang="less" >

.form-content{
  display: flex;
  width: 100%;

  box-sizing: border-box;
  >div {
    flex-grow: 2;
    >h3{
      font-weight: 600;
      margin-bottom: 20px;
    }
  }
}
</style>