<script setup lang="ts">
import {reactive} from 'vue'
import {encrypt} from "@src/units/tool.ts"
import axios from "axios";

const submitParams = reactive({
  value: {
    officeLocation: 'S101', // S101 公司 S102 家里
    period: 'S100',  // S100 全天  S101上午 S102 下午
    projectCode: "PRJ00097002",
    projectName: "寿仙谷数智项目二阶段",
    workAddress: "四川省成都市",
    workLog: "  1、云商城小程序测试bug修改 100%\n    2、crm-web后台测试bug修改 100%",
    workReportTime: "2025-10-28",
    workReportType: "S100", // S100 正常 s101 加班
  }
})


const domainName = "http://hr.biz-united.com.cn:8210"

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Host": "hr.biz-united.com.cn:8210",
  Loginusertoken: "86c197c6117d478db1d3dda8d357f7b8",
  "Menucode": "CRM20220511000002407",
  "Origin": domainName,
  "Referer": `${domainName}/engineering_center/engineering_management`,
}

const recordWork = () => {
  axios.post('http://hr.biz-united.com.cn:8210/mdm/mdmhrworkreport/save', {
    ...submitParams.value,
    id: new Date().getTime(),
  }, {
    headers: {
      ...headers,
      "Cookie": `SECKEY_ABVK=cW4GdjvbDGKdLsMPG0R+JHjYINoCSV3GOUUw+HfuFE0%3D; BMAP_SECKEY=1jFrNTTYNJyxjWcGiigDlHfRlr146yAcHz2ku8Og_C2-gnUz0kN5fvZdOaawGe--iHZmXReus7XzHzqAV5L_fQLnRqJ6OorHVJ2Jl5OdfWs4ZmgnDkvbZFGoGPl3uH1CQmbKUOIrsSE1B3p7HZXqyKtVUj2vgA7oCm6DEC9Z2CMsCaiH2rRD5eJVX66NWJzA; loginUserToken=${headers.Loginusertoken}`,
    }
  })
}


const submitLogin = async () => {
  const res = await axios.post(`${domainName}/mdm/mdmSystemLoginController/login`, {
    pazjofxkyvyoosot: encrypt("Biz@20070201"),
    ujlrwebjruzddjnu: "YH0342"
  })
  console.log(res);
}
submitLogin()
</script>

<template>
  <div class="report">
    <div class="form">
      <el-form-item label="报工编码">
        <el-input v-model="submitParams.value.projectCode" placeholder="请输入报工编码"></el-input>
      </el-form-item>
      <el-form-item label="项目名称">
        <el-input v-model="submitParams.value.projectName" placeholder="请输入项目名称"></el-input>
      </el-form-item>
      <el-form-item label="办公地点">
        <el-input v-model="submitParams.value.workAddress" placeholder="请输入工作地点"></el-input>
      </el-form-item>
      <el-form-item label="报工时间">
        <el-date-picker
            style="width: 100%;"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" v-model="submitParams.value.workReportTime"></el-date-picker>
      </el-form-item>
      <el-form-item label="是否加班">
        <el-select v-model="submitParams.value.workReportType">
          <el-option label="正常" value="S100"></el-option>
          <el-option label="加班" value="S101"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="时段">
        <el-select v-model="submitParams.value.period">
          <el-option label="全天" value="S100"></el-option>
          <el-option label="上午" value="S101"></el-option>
          <el-option label="下午" value="S102"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="工作内容" class="last-form">
        <el-input v-model="submitParams.value.workLog" placeholder="请输入工作内容" type="textarea"></el-input>
      </el-form-item>
    </div>
    <el-button type="primary" @click="recordWork">提交</el-button>
  </div>

</template>

<style scoped lang="less">
.report {
  margin: 0 auto;
  width: 60%;
  text-align: right;
}

.form {

  display: grid;
  /*  声明行间距和列间距  */
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 0 100px;
  //grid-template-rows: 50px 50px;
  /*  声明行的高度  */

  .last-form {
    grid-row-start: 7;
    grid-row-end: 3;
    width: 100%;
    grid-column: span 3;
  }
}
</style>