<template>
  <page-header-wrapper :title="null">
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="16">
            <a-col :md="8" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="名称/设备" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="来源">
                <a-select v-model="query.source_type" allowClear placeholder="全部" style="width: 160px">
                  <a-select-option value="switch">交换机 ACL</a-select-option>
                  <a-select-option value="security">安全设备策略</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="fetch(1)">查询</a-button>
                <a-button style="margin-left: 8px" @click="reset">重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button type="primary" icon="plus" @click="openModal">新增策略</a-button>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1200, y: tableHeight }"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="source_type" slot-scope="text">
          <a-tag color="blue" v-if="text === 'switch'">交换机 ACL</a-tag>
          <a-tag color="orange" v-else>安全设备</a-tag>
        </template>
        <template slot="synced_at" slot-scope="text">
          <span>{{ formatTime(text) }}</span>
        </template>
        <template slot="action" slot-scope="text, record">
          <a @click="openModal(record)">编辑</a>
          <a-divider type="vertical" />
          <a-popconfirm title="确认删除该策略？" @confirm="() => handleDelete(record)">
            <a style="color: #ff4d4f">删除</a>
          </a-popconfirm>
        </template>
      </a-table>
    </a-card>

    <a-modal
      :title="editing ? '编辑策略' : '新增策略'"
      :visible="modalVisible"
      :confirmLoading="saving"
      @ok="handleSave"
      @cancel="handleCancel"
      width="760px"
    >
      <a-form :form="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :md="12" :sm="24">
            <a-form-item label="名称">
              <a-input v-decorator="['name', { rules: [{ required: true, message: '请输入名称' }] }]" />
            </a-form-item>
          </a-col>
          <a-col :md="12" :sm="24">
            <a-form-item label="来源">
              <a-select v-decorator="['source_type', { initialValue: 'switch' }]" @change="onSourceTypeChange">
                <a-select-option value="switch">交换机 ACL</a-select-option>
                <a-select-option value="security">安全设备策略</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :md="12" :sm="24">
            <a-form-item label="设备/标识">
              <a-input v-decorator="['device']" />
            </a-form-item>
          </a-col>
          <a-col :md="12" :sm="24">
            <a-form-item label="同步时间">
              <a-date-picker showTime style="width: 100%" v-decorator="['synced_at']" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="摘要">
          <a-textarea v-decorator="['summary']" :rows="3" />
        </a-form-item>
        <div v-if="currentSource === 'switch'">
          <div class="sub-title">
            ACL 规则
            <a-button size="small" type="link" @click="applyTemplate('switch')">填充示例</a-button>
            <a-button size="small" type="primary" icon="plus" @click="addAclRule">新增规则</a-button>
          </div>
          <div class="rule-table">
            <div class="rule-row header">
              <span>序号</span><span>动作</span><span>源</span><span>目的</span><span>服务</span><span>备注</span><span>操作</span>
            </div>
            <div class="rule-row" v-for="(r, idx) in aclRules" :key="idx">
              <a-input-number v-model="r.seq" :min="1" style="width: 70px" />
              <a-select v-model="r.action" style="width: 90px">
                <a-select-option value="permit">允许</a-select-option>
                <a-select-option value="deny">拒绝</a-select-option>
              </a-select>
              <a-input v-model="r.src" placeholder="10.0.0.0/24" />
              <a-input v-model="r.dst" placeholder="any" />
              <a-input v-model="r.service" placeholder="tcp/80" />
              <a-input v-model="r.remark" placeholder="备注" />
              <a-button type="link" @click="removeAclRule(idx)">删除</a-button>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="sub-title">
            安全设备策略
            <a-button size="small" type="link" @click="applyTemplate('security')">填充示例</a-button>
            <a-button size="small" type="primary" icon="plus" @click="addSecPolicy">新增策略</a-button>
          </div>
          <div class="rule-table">
            <div class="rule-row header">
              <span>名称</span><span>源区</span><span>目的区</span><span>源</span><span>目的</span><span>应用</span><span>动作</span><span>操作</span>
            </div>
            <div class="rule-row" v-for="(p, idx) in secPolicies" :key="idx">
              <a-input v-model="p.name" placeholder="策略名" />
              <a-input v-model="p.src_zone" placeholder="trust" />
              <a-input v-model="p.dst_zone" placeholder="dmz" />
              <a-input v-model="p.src" placeholder="10.0.0.0/24" />
              <a-input v-model="p.dst" placeholder="172.16.0.10" />
              <a-input v-model="p.app" placeholder="http" />
              <a-select v-model="p.action" style="width: 90px">
                <a-select-option value="permit">允许</a-select-option>
                <a-select-option value="deny">拒绝</a-select-option>
              </a-select>
              <a-button type="link" @click="removeSecPolicy(idx)">删除</a-button>
            </div>
          </div>
        </div>
      </a-form>
    </a-modal>
  </page-header-wrapper>
</template>

<script>
import {
  listStrategyPolicies,
  createStrategyPolicy,
  updateStrategyPolicy,
  deleteStrategyPolicy
} from '@/api/strategy'

export default {
  name: 'StrategyPolicies',
  data () {
    return {
      form: this.$form.createForm(this),
      query: { q: '', source_type: '' },
      loading: false,
      saving: false,
      modalVisible: false,
      editing: null,
      dataSource: [],
      tableHeight: 520,
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: total => `共 ${total} 条`
      },
      currentSource: 'switch',
      aclRules: [],
      secPolicies: [],
      columns: [
        { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
        { title: '来源', dataIndex: 'source_type', key: 'source_type', width: 120, scopedSlots: { customRender: 'source_type' } },
        { title: '设备', dataIndex: 'device', key: 'device', width: 180 },
        { title: '同步时间', dataIndex: 'synced_at', key: 'synced_at', width: 180, scopedSlots: { customRender: 'synced_at' } },
        { title: '摘要', dataIndex: 'summary', key: 'summary', width: 300, ellipsis: true },
        { title: '操作', key: 'action', width: 140, scopedSlots: { customRender: 'action' }, fixed: 'right' }
      ]
    }
  },
  created () {
    this.fetch(1)
  },
  mounted () {
    this.updateTableHeight()
    window.addEventListener('resize', this.updateTableHeight)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.updateTableHeight)
  },
  methods: {
    updateTableHeight () {
      const h = window.innerHeight || 800
      this.tableHeight = Math.max(h - 260, 220)
    },
    formatTime (ts) {
      if (!ts) return '-'
      return new Date(ts).toLocaleString()
    },
    reset () {
      this.query = { q: '', source_type: '' }
      this.fetch(1)
    },
    async fetch (page = 1) {
      this.loading = true
      try {
        const params = { page }
        if (this.query.source_type) params.source_type = this.query.source_type
        if (this.query.q) params.q = this.query.q
        const data = await listStrategyPolicies(params)
        this.dataSource = data.results || data
        this.pagination.total = data.count || this.dataSource.length
        this.pagination.current = page
      } catch (e) {
        const detail = (e.response && e.response.data && e.response.data.detail) || e.message
        this.$notification.error({ message: '加载失败', description: detail })
      } finally {
        this.loading = false
      }
    },
    handleTableChange (pagination) {
      this.fetch(pagination.current || 1)
    },
    openModal (record) {
      this.editing = record || null
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.resetFields()
        if (record) {
          const init = { ...record }
          if (record.synced_at) {
            init.synced_at = this.$moment(record.synced_at)
          }
          this.form.setFieldsValue(init)
          this.onSourceTypeChange(record.source_type || 'switch')
          this.loadRules(record.raw_rules, record.source_type)
        } else {
          this.form.resetFields()
          this.onSourceTypeChange('switch')
          this.aclRules = []
          this.secPolicies = []
        }
      })
    },
    onSourceTypeChange (val) {
      this.currentSource = val
    },
    applyTemplate (type) {
      const aclTemplate = {
        rules: [
          { seq: 10, action: 'permit', src: '10.0.0.0/24', dst: 'any', service: 'tcp/80', remark: '示例允许 HTTP' },
          { seq: 20, action: 'deny', src: 'any', dst: 'any', service: 'any', remark: '默认拒绝' }
        ]
      }
      const secTemplate = {
        policies: [
          { name: 'allow-web', src_zone: 'trust', dst_zone: 'dmz', src: '10.0.0.0/24', dst: '172.16.0.10', app: 'http', action: 'permit' },
          { name: 'deny-all', src_zone: 'any', dst_zone: 'any', src: 'any', dst: 'any', app: 'any', action: 'deny' }
        ]
      }
      const tpl = type === 'switch' ? aclTemplate : secTemplate
      this.form.setFieldsValue({ source_type: type })
      this.onSourceTypeChange(type)
      this.loadRules(tpl, type)
    },
    addAclRule () {
      this.aclRules.push({ seq: 10, action: 'permit', src: '', dst: '', service: '', remark: '' })
    },
    removeAclRule (idx) {
      this.aclRules.splice(idx, 1)
    },
    addSecPolicy () {
      this.secPolicies.push({ name: '', src_zone: '', dst_zone: '', src: '', dst: '', app: '', action: 'permit' })
    },
    removeSecPolicy (idx) {
      this.secPolicies.splice(idx, 1)
    },
    loadRules (raw, type) {
      if (!raw || typeof raw !== 'object') {
        this.aclRules = []
        this.secPolicies = []
        return
      }
      if (type === 'security' && raw.policies) {
        this.secPolicies = raw.policies
        this.aclRules = []
      } else if (raw.rules) {
        this.aclRules = raw.rules
        this.secPolicies = []
      } else {
        this.aclRules = []
        this.secPolicies = []
      }
    },
    handleSave () {
      this.form.validateFields(async (err, values) => {
        if (err) return
        this.saving = true
        try {
          const payload = { ...values }
          if (payload.synced_at && payload.synced_at.toDate) {
            payload.synced_at = payload.synced_at.toDate()
          }
          // 组装规则
          payload.raw_rules = this.currentSource === 'switch'
            ? { rules: this.aclRules }
            : { policies: this.secPolicies }

          if (this.editing) {
            await updateStrategyPolicy(this.editing.id, payload)
          } else {
            await createStrategyPolicy(payload)
          }
          this.$message.success('已保存')
          this.modalVisible = false
          this.fetch(this.pagination.current || 1)
        } catch (e) {
          const detail = (e.response && e.response.data && e.response.data.detail) || e.message
          this.$notification.error({ message: '保存失败', description: detail })
        } finally {
          this.saving = false
        }
      })
    },
    handleCancel () {
      this.modalVisible = false
    },
    handleDelete (record) {
      deleteStrategyPolicy(record.id)
        .then(() => {
          this.$message.success('已删除')
          this.fetch(this.pagination.current || 1)
        })
        .catch(e => {
          const detail = (e.response && e.response.data && e.response.data.detail) || e.message
          this.$notification.error({ message: '删除失败', description: detail })
        })
    }
  }
}
</script>
