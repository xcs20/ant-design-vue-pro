<template>
  <page-header-wrapper>
    <a-row :gutter="16">
      <a-col :md="12" :sm="24">
        <a-card title="系统运行状况" :loading="loading">
          <a-descriptions size="small" column="1" bordered>
            <a-descriptions-item label="主机名">{{ server.host || '-' }}</a-descriptions-item>
            <a-descriptions-item label="操作系统">{{ server.system }} {{ server.release }}</a-descriptions-item>
            <a-descriptions-item label="Python">{{ server.python_version }}</a-descriptions-item>
            <a-descriptions-item label="Django">{{ server.django_version }}</a-descriptions-item>
            <a-descriptions-item label="当前时间">{{ formatTime(server.time_unix) }}</a-descriptions-item>
            <a-descriptions-item label="系统运行时长">
              <span v-if="server.uptime_seconds !== null">{{ prettyDuration(server.uptime_seconds) }}</span>
              <span v-else>-</span>
            </a-descriptions-item>
            <a-descriptions-item label="负载">
              <span v-if="server.loadavg">{{ server.loadavg.join(' / ') }}</span>
              <span v-else>-</span>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      <a-col :md="12" :sm="24">
        <a-card
          :loading="loading"
          :title="`SNMP Agent 状态`"
          :extra="snmpAgent.status || '-'"
          :headStyle="{ color: snmpAgent.status === 'ok' ? '#52c41a' : '#faad14' }"
        >
          <a-descriptions size="small" column="1" bordered>
            <a-descriptions-item label="HTTP 状态">{{ snmpAgent.http_status || '-' }}</a-descriptions-item>
            <a-descriptions-item label="版本">{{ snmpAgent.go_version || '-' }}</a-descriptions-item>
            <a-descriptions-item label="启动时间">{{ snmpAgent.start_time || '-' }}</a-descriptions-item>
            <a-descriptions-item label="运行时长">
              <span v-if="snmpAgent.uptime_seconds">{{ prettyDuration(snmpAgent.uptime_seconds) }}</span>
              <span v-else>-</span>
            </a-descriptions-item>
            <a-descriptions-item label="请求总数">{{ snmpAgent.requests_total || 0 }}</a-descriptions-item>
            <a-descriptions-item label="最后访问">
              <span v-if="snmpAgent.last_request_unix">{{ formatTime(snmpAgent.last_request_unix) }}</span>
              <span v-else>-</span>
            </a-descriptions-item>
            <a-descriptions-item label="消息">
              <span>{{ snmpAgent.error || 'OK' }}</span>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>
    <div style="margin-top: 12px">
      <a-button type="primary" icon="reload" :loading="loading" @click="fetchStatus">刷新</a-button>
    </div>
  </page-header-wrapper>
</template>

<script>
import { getSystemStatus } from '@/api/system'

export default {
  name: 'SystemStatus',
  data () {
    return {
      loading: false,
      server: {},
      snmpAgent: {}
    }
  },
  created () {
    this.fetchStatus()
  },
  methods: {
    async fetchStatus () {
      this.loading = true
      try {
        const data = await getSystemStatus()
        this.server = data.server || {}
        this.snmpAgent = data.snmp_agent || {}
      } catch (e) {
        const detail = (e.response && e.response.data && e.response.data.detail) || e.message
        this.$notification.error({ message: '加载失败', description: detail })
      } finally {
        this.loading = false
      }
    },
    formatTime (ts) {
      if (!ts) return '-'
      return new Date(ts * 1000).toLocaleString()
    },
    prettyDuration (sec) {
      if (sec === null || sec === undefined) return '-'
      const days = Math.floor(sec / 86400)
      const hours = Math.floor((sec % 86400) / 3600)
      const minutes = Math.floor((sec % 3600) / 60)
      const parts = []
      if (days) parts.push(`${days}天`)
      if (hours) parts.push(`${hours}小时`)
      if (minutes) parts.push(`${minutes}分`)
      if (!parts.length) parts.push(`${Math.floor(sec)}秒`)
      return parts.join(' ')
    }
  }
}
</script>
