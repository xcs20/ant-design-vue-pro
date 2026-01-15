<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="6" :sm="24">
              <a-form-item label="任务类型">
                <a-select v-model="query.type" allowClear placeholder="全部" style="width: 100%">
                  <a-select-option value="port_assets">IP 资产同步</a-select-option>
                  <a-select-option value="interfaces">接口同步</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="6" :sm="24">
              <a-form-item label="状态">
                <a-select v-model="query.status" allowClear placeholder="全部" style="width: 100%">
                  <a-select-option value="queued">排队中</a-select-option>
                  <a-select-option value="running">执行中</a-select-option>
                  <a-select-option value="success">成功</a-select-option>
                  <a-select-option value="failed">失败</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="6" :sm="24">
              <a-form-item label="交换机ID">
                <a-input v-model="query.switch" placeholder="数字 ID" />
              </a-form-item>
            </a-col>
            <a-col :md="6" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="fetch(1)">查询</a-button>
                <a-button style="margin-left: 8px" @click="reset">重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button v-if="$auth('system.add')" type="primary" icon="plus" @click="openCreate">新建任务</a-button>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1400, y: tableHeight }"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="created_at" slot-scope="text, record">
          <span v-if="record.created_at">{{ record.created_at | moment }}</span>
          <span v-else>-</span>
        </template>
        <template slot="task_type" slot-scope="text">
          <a-tag color="blue">{{ typeLabel(text) }}</a-tag>
        </template>
        <template slot="status" slot-scope="text">
          <a-tag :color="statusColor(text)">{{ statusLabel(text) }}</a-tag>
        </template>
        <template slot="started_at" slot-scope="text, record">
          <span v-if="record.started_at">{{ record.started_at | moment }}</span>
          <span v-else>-</span>
        </template>
        <template slot="finished_at" slot-scope="text, record">
          <span v-if="record.finished_at">{{ record.finished_at | moment }}</span>
          <span v-else>-</span>
        </template>
        <template slot="actions" slot-scope="text, record">
          <a @click="openDetail(record)">查看</a>
          <a-divider v-if="$auth('system.update')" type="vertical" />
          <a v-if="$auth('system.update')" @click="openEdit(record)">编辑</a>
          <a-divider v-if="$auth('system.delete')" type="vertical" />
          <a-popconfirm v-if="$auth('system.delete')" title="确认删除该任务？" @confirm="() => handleDelete(record)">
            <a style="color: #ff4d4f">删除</a>
          </a-popconfirm>
        </template>
      </a-table>

      <a-modal
        :title="modalTitle"
        :visible="modalVisible"
        :confirmLoading="saving"
        @ok="handleSubmit"
        @cancel="handleCancel"
        width="720px"
      >
        <a-form :form="form" layout="vertical">
          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="任务类型">
                <a-select v-decorator="['task_type', { rules: [{ required: true, message: '请选择任务类型' }] }]" style="width: 100%">
                  <a-select-option value="port_assets">IP 资产同步</a-select-option>
                  <a-select-option value="interfaces">接口同步</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="状态">
                <a-select v-decorator="['status', { initialValue: 'queued' }]" style="width: 100%">
                  <a-select-option value="queued">排队中</a-select-option>
                  <a-select-option value="running">执行中</a-select-option>
                  <a-select-option value="success">成功</a-select-option>
                  <a-select-option value="failed">失败</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="目标">
                <a-input v-decorator="['target_label']" placeholder="例如 ALL / 设备编号" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="交换机ID">
                <a-input-number v-decorator="['switch']" :min="1" style="width: 100%" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="备注">
            <a-textarea v-decorator="['message']" :rows="2" />
          </a-form-item>
          <a-form-item label="结果(JSON)">
            <a-textarea v-decorator="['result']" :rows="4" placeholder='{"example": 1}' />
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal title="任务详情" :visible="detailVisible" @cancel="detailVisible = false" :footer="null" width="860px">
        <a-descriptions bordered size="small" :column="2">
          <a-descriptions-item label="任务类型">{{ typeLabel(detailRecord && detailRecord.task_type) }}</a-descriptions-item>
          <a-descriptions-item label="状态">{{ statusLabel(detailRecord && detailRecord.status) }}</a-descriptions-item>
          <a-descriptions-item label="目标">{{ (detailRecord && detailRecord.target_label) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="交换机">{{ (detailRecord && detailRecord.switch_name) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="创建人">{{ (detailRecord && detailRecord.created_by_name) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="任务ID">{{ (detailRecord && detailRecord.task_id) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="开始时间">{{ (detailRecord && detailRecord.started_at) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="结束时间">{{ (detailRecord && detailRecord.finished_at) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="备注" :span="2">{{ (detailRecord && detailRecord.message) || '-' }}</a-descriptions-item>
        </a-descriptions>
        <a-divider>结果</a-divider>
        <pre style="max-height: 360px; overflow: auto; background: #0b1021; color: #e6edf3; padding: 12px; border-radius: 6px">{{ pretty(detailRecord && detailRecord.result) }}</pre>
      </a-modal>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { listSystemTasks, createSystemTask, updateSystemTask, deleteSystemTask } from '@/api/system'

export default {
  name: 'SystemTasks',
  data () {
    return {
      form: this.$form.createForm(this),
      query: { type: undefined, status: undefined, switch: '' },
      loading: false,
      saving: false,
      dataSource: [],
      tableHeight: 520,
      modalVisible: false,
      editing: null,
      refreshTimer: null,
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: total => `共 ${total} 条`
      },
      columns: [
        { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180, scopedSlots: { customRender: 'created_at' } },
        { title: '任务类型', dataIndex: 'task_type', key: 'task_type', width: 140, scopedSlots: { customRender: 'task_type' } },
        { title: '状态', dataIndex: 'status', key: 'status', width: 110, scopedSlots: { customRender: 'status' } },
        { title: '目标', dataIndex: 'target_label', key: 'target_label', width: 140 },
        { title: '交换机', dataIndex: 'switch_name', key: 'switch_name', width: 160 },
        { title: '创建人', dataIndex: 'created_by_name', key: 'created_by_name', width: 120 },
        { title: '开始时间', dataIndex: 'started_at', key: 'started_at', width: 180, scopedSlots: { customRender: 'started_at' } },
        { title: '结束时间', dataIndex: 'finished_at', key: 'finished_at', width: 180, scopedSlots: { customRender: 'finished_at' } },
        { title: '备注', dataIndex: 'message', key: 'message', width: 240 },
        { title: '操作', key: 'actions', width: 160, fixed: 'right', scopedSlots: { customRender: 'actions' } }
      ],
      detailVisible: false,
      detailRecord: null
    }
  },
  created () {
    this.fetch(1)
    this.updateTableHeight()
    window.addEventListener('resize', this.updateTableHeight)
    this.startAutoRefresh()
  },
  computed: {
    modalTitle () {
      return this.editing ? '编辑任务' : '新建任务'
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.updateTableHeight)
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  },
  methods: {
    async fetch (page) {
      this.loading = true
      try {
        const params = { page: page || 1 }
        if (this.query.type) params.type = this.query.type
        if (this.query.status) params.status = this.query.status
        const switchId = (this.query.switch || '').trim()
        if (switchId) params.switch = switchId
        const data = await listSystemTasks(params)
        this.dataSource = data.results || []
        this.pagination.total = data.count || 0
        this.pagination.current = page || 1
      } catch (e) {
        this.$notification.error({
          message: '获取失败',
          description: (e.response && e.response.data && e.response.data.detail) || e.message
        })
      } finally {
        this.loading = false
      }
    },
    reset () {
      this.query = { type: undefined, status: undefined, switch: '' }
      this.fetch(1)
    },
    handleTableChange (pagination) {
      this.fetch(pagination.current || 1)
    },
    startAutoRefresh () {
      if (this.refreshTimer) return
      this.refreshTimer = setInterval(() => {
        if (this.loading || this.modalVisible) return
        this.fetch(this.pagination.current || 1)
      }, 10000)
    },
    openCreate () {
      this.editing = null
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.resetFields()
      })
    },
    openEdit (record) {
      this.editing = record
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.setFieldsValue({
          task_type: record.task_type,
          status: record.status,
          target_label: record.target_label || '',
          switch: record.switch || undefined,
          message: record.message || '',
          result: record.result ? JSON.stringify(record.result, null, 2) : ''
        })
      })
    },
    handleCancel () {
      this.modalVisible = false
      this.editing = null
    },
    handleSubmit () {
      this.form.validateFields(async (err, values) => {
        if (err) return
        this.saving = true
        try {
          const payload = {
            task_type: values.task_type,
            status: values.status,
            target_label: values.target_label || '',
            switch: values.switch || null,
            message: values.message || ''
          }
          if ((values.result || '').trim()) {
            try {
              payload.result = JSON.parse(values.result)
            } catch (e) {
              this.$notification.error({ message: '结果格式错误', description: '请填写合法 JSON' })
              this.saving = false
              return
            }
          }
          if (this.editing) {
            await updateSystemTask(this.editing.id, payload)
            this.$notification.success({ message: '更新成功' })
          } else {
            await createSystemTask(payload)
            this.$notification.success({ message: '创建成功' })
          }
          this.modalVisible = false
          this.editing = null
          this.fetch(this.pagination.current)
        } catch (e) {
          this.$notification.error({
            message: '保存失败',
            description: (e.response && e.response.data && e.response.data.detail) || e.message
          })
        } finally {
          this.saving = false
        }
      })
    },
    async handleDelete (record) {
      try {
        await deleteSystemTask(record.id)
        this.$notification.success({ message: '删除成功' })
        this.fetch(this.pagination.current)
      } catch (e) {
        this.$notification.error({
          message: '删除失败',
          description: (e.response && e.response.data && e.response.data.detail) || e.message
        })
      }
    },
    openDetail (record) {
      this.detailRecord = record
      this.detailVisible = true
    },
    typeLabel (value) {
      if (value === 'port_assets') return 'IP 资产同步'
      if (value === 'interfaces') return '接口同步'
      return value || '-'
    },
    statusLabel (value) {
      if (value === 'queued') return '排队中'
      if (value === 'running') return '执行中'
      if (value === 'success') return '成功'
      if (value === 'failed') return '失败'
      return value || '-'
    },
    statusColor (value) {
      if (value === 'running') return 'blue'
      if (value === 'success') return 'green'
      if (value === 'failed') return 'red'
      return 'default'
    },
    updateTableHeight () {
      const height = window.innerHeight || 800
      this.tableHeight = Math.max(240, height - 360)
    },
    pretty (data) {
      try {
        if (!data) return '{}'
        return JSON.stringify(data, null, 2)
      } catch (e) {
        return String(data || '')
      }
    }
  }
}
</script>
