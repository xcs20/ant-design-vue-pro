<template>
  <page-header-wrapper :title="null">
    <div class="header">
      <div>
        <div class="title">{{ timeFix }}，{{ user.name }}</div>
        <div class="sub">资产运维仪表盘 · 概览</div>
      </div>
      <div class="header-actions">
        <a-button type="default" icon="reload" :loading="loading" @click="fetch">刷新</a-button>
        <a-button type="primary" style="margin-left: 8px" icon="setting" @click="$router.push('/audit/syslog')">日志审计</a-button>
      </div>
    </div>

    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :md="6" :sm="12" :xs="24" v-for="card in cardList" :key="card.key">
        <a-card :loading="loading" :bordered="false" class="stat-card">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-desc">{{ card.desc }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <a-col :md="16" :sm="24">
        <a-card title="IP 网段使用率" :loading="loading" :bordered="false">
          <a-empty v-if="!ipRanges.length" description="暂无网段" />
          <div v-else>
            <div v-for="item in ipRanges" :key="item.id" class="range-item">
              <div class="range-header">
                <span>{{ item.name }} ({{ item.cidr }})</span>
                <span class="range-meta">{{ item.used_count }}/{{ item.total_count }} 已用</span>
              </div>
              <a-progress :percent="item.usage_percent" size="small" :status="item.usage_percent > 80 ? 'exception' : 'active'" />
              <div class="range-footer">剩余 {{ item.free_count }} 个可用地址</div>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :md="8" :sm="24">
        <a-card :loading="loading" title="同步中心" :bordered="false">
          <div class="agent-status" :class="snmpAgent.status">
            <div class="dot" />
            <span>{{ snmpAgent.status || '-' }}</span>
          </div>
          <a-descriptions size="small" :column="1" bordered style="margin-top: 8px">
            <a-descriptions-item label="版本">{{ snmpAgent.go_version || '-' }}</a-descriptions-item>
            <a-descriptions-item label="启动时间">{{ snmpAgent.start_time || '-' }}</a-descriptions-item>
            <a-descriptions-item label="请求数">{{ snmpAgent.requests_total || 0 }}</a-descriptions-item>
            <a-descriptions-item label="最后访问">
              <span v-if="snmpAgent.last_request_unix">{{ formatTime(snmpAgent.last_request_unix) }}</span>
              <span v-else>-</span>
            </a-descriptions-item>
            <a-descriptions-item label="消息">{{ snmpAgent.error || 'OK' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card :loading="loading" title="任务管理" :bordered="false" style="margin-top: 16px">
          <div class="agent-status" :class="taskManager.status">
            <div class="dot" />
            <span>{{ taskManager.status || '-' }}</span>
          </div>
          <a-descriptions size="small" :column="1" bordered style="margin-top: 8px">
            <a-descriptions-item label="Worker 数量">{{ taskManager.worker_count || 0 }}</a-descriptions-item>
            <a-descriptions-item label="Worker 列表">
              <span v-if="taskManager.workers && taskManager.workers.length">{{ taskManager.workers.join(', ') }}</span>
              <span v-else>-</span>
            </a-descriptions-item>
            <a-descriptions-item label="消息">{{ taskManager.error || 'OK' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card :loading="loading" title="日志审计" :bordered="false" style="margin-top: 16px">
          <a-descriptions size="small" :column="1" bordered>
            <a-descriptions-item label="日志总数">{{ audit.total || 0 }}</a-descriptions-item>
            <a-descriptions-item label="最新时间">
              <span v-if="audit.latest_timestamp">{{ formatTime(audit.latest_timestamp) }}</span>
              <span v-else>-</span>
            </a-descriptions-item>
            <a-descriptions-item label="来源">{{ audit.latest_host || '-' }}</a-descriptions-item>
            <a-descriptions-item label="Severity">{{ audit.latest_severity || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card :loading="loading" title="最新操作" :bordered="false" style="margin-top: 16px">
          <a-list size="small" :data-source="logs" :renderItem="renderLog" />
          <div v-if="!logs || !logs.length" style="padding: 12px; text-align: center; color: #999">暂无操作</div>
        </a-card>
      </a-col>
    </a-row>
  </page-header-wrapper>
</template>

<script>
import { timeFix } from '@/utils/util'
import { mapState } from 'vuex'
import { PageHeaderWrapper } from '@ant-design-vue/pro-layout'
import { getDashboardSummary } from '@/api/dashboard'

export default {
  name: 'Workplace',
  components: {
    PageHeaderWrapper
  },
  data () {
    return {
      timeFix: timeFix(),
      user: {},
      loading: false,
      cardList: [],
      ipRanges: [],
      snmpAgent: {},
      taskManager: {},
      audit: {},
      logs: []
    }
  },
  computed: {
    ...mapState({
      nickname: state => state.user.nickname,
      welcome: state => state.user.welcome
    }),
    userInfo () {
      return this.$store.getters.userInfo
    }
  },
  created () {
    this.user = this.userInfo
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      try {
        const data = await getDashboardSummary()
        const cards = data.cards || {}
        this.cardList = [
          { key: 'switches', label: '网络设备', value: cards.switches || 0, desc: '已录入的网络设备总数' },
          { key: 'interfaces', label: '接口数量', value: cards.interfaces || 0, desc: '同步的接口条目' },
          { key: 'port_assets', label: 'IP 地址资产', value: cards.port_assets || 0, desc: '资产中管理的 IP 记录' },
          { key: 'ip_ranges', label: '网段数量', value: cards.ip_ranges || 0, desc: '定义的网段个数' },
          { key: 'syslog_entries', label: '日志审计', value: cards.syslog_entries || 0, desc: '已收集的审计日志' }
        ]
        this.ipRanges = data.ip_ranges || []
        this.snmpAgent = data.snmp_agent || {}
        this.taskManager = data.task_manager || {}
        this.audit = data.audit || {}
        this.logs = data.logs || []
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
    renderLog (item) {
      return (
        <a-list-item>
          <div>
            <strong>{item.method}</strong>
            <span style="margin-left:8px">{item.path}</span>
          </div>
          <div style="color:#888;font-size:12px">{item.user} · {new Date(item.created_at).toLocaleString()} · {item.status_code}</div>
        </a-list-item>
      )
    }
  }
}
</script>

<style lang="less" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  .title {
    font-size: 20px;
    font-weight: 600;
  }
  .sub {
    color: #888;
    margin-top: 4px;
  }
  .header-actions {
    display: flex;
    align-items: center;
  }
}

.stat-card {
  background: linear-gradient(135deg, #f3f6ff, #fff);
  .stat-label {
    color: #888;
    margin-bottom: 6px;
  }
  .stat-value {
    font-size: 24px;
    font-weight: 700;
  }
  .stat-desc {
    color: #999;
    margin-top: 4px;
    font-size: 12px;
  }
}

.range-item {
  margin-bottom: 12px;
  .range-header {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
  }
  .range-meta {
    color: #888;
  }
  .range-footer {
    color: #888;
    font-size: 12px;
  }
}

.agent-status {
  display: flex;
  align-items: center;
  font-weight: 600;
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
    background: #d9d9d9;
  }
  &.ok .dot {
    background: #52c41a;
  }
  &.error .dot {
    background: #f5222d;
  }
}
</style>
