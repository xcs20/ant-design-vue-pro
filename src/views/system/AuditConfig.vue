<template>
  <page-header-wrapper :title="null">
    <a-card :bordered="false">
      <div class="table-operator">
        <a-button type="primary" icon="plus" @click="openModal">新增配置</a-button>
      </div>

      <a-table
        :columns="columns"
        :dataSource="configs"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1200 }"
        rowKey="id"
      >
        <template slot="listen_ports" slot-scope="text">
          <a-tag v-for="p in text || []" :key="p">{{ p }}</a-tag>
        </template>
        <template slot="severity" slot-scope="text">
          <span v-if="text && text.length">{{ text.join(',') }}</span>
          <span v-else>-</span>
        </template>
        <template slot="action" slot-scope="text, record">
          <a @click="openModal(record)">编辑</a>
          <a-divider type="vertical" />
          <a-popconfirm title="确认删除该配置？" @confirm="() => handleDelete(record)">
            <a style="color: #ff4d4f">删除</a>
          </a-popconfirm>
        </template>
      </a-table>
    </a-card>

    <a-modal
      :title="editing ? '编辑配置' : '新增配置'"
      :visible="modalVisible"
      :confirmLoading="saving"
      @ok="handleSave"
      @cancel="handleCancel"
      width="780px"
    >
      <a-form :form="form" layout="vertical">
        <a-divider>接收与网络</a-divider>
        <a-row :gutter="16">
          <a-col :md="12" :sm="24">
            <a-form-item label="采集来源说明">
              <a-input v-decorator="['source', { rules: [{ required: true, message: '请输入来源说明' }] }]" placeholder="例如：交换机 syslog" />
            </a-form-item>
          </a-col>
          <a-col :md="12" :sm="24">
            <a-form-item label="允许主机（逗号分隔）">
              <a-input v-decorator="['allowed_hosts']" placeholder="10.0.0.0/24,192.168.1.10" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :md="12" :sm="24">
            <a-form-item label="监听端口">
              <a-checkbox-group
                v-decorator="['listen_ports', { initialValue: ['udp514', 'tcp514'] }]"
                :options="[
                  { label: 'UDP 514', value: 'udp514' },
                  { label: 'TCP 514', value: 'tcp514' }
                ]"
              />
            </a-form-item>
          </a-col>
          <a-col :md="12" :sm="24">
            <a-form-item label="防火墙放行">
              <a-select v-decorator="['firewall_policy', { initialValue: 'trusted_only' }]" style="width: 100%">
                <a-select-option value="trusted_only">仅可信网段</a-select-option>
                <a-select-option value="open_all">全部放行（不推荐）</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>存储与策略</a-divider>
        <a-row :gutter="16">
          <a-col :md="12" :sm="24">
            <a-form-item label="存储保留天数">
              <a-input-number v-decorator="['retention_days', { initialValue: 30 }]" :min="1" :max="3650" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :md="12" :sm="24">
            <a-form-item label="存储目录">
              <a-input v-decorator="['storage_dir', { initialValue: '/var/log/syslog-audit' }]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :md="12" :sm="24">
            <a-form-item label="Severity 过滤（留空为全部）">
              <a-select v-decorator="['severity']" allowClear mode="multiple" placeholder="选择需要存储的 Severity">
                <a-select-option v-for="s in severities" :key="s" :value="s">{{ s }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :md="12" :sm="24">
            <a-form-item label="存储规则">
              <a-select v-decorator="['storage_rule', { initialValue: 'by_host' }]" style="width: 100%">
                <a-select-option value="by_host">按来源主机分组</a-select-option>
                <a-select-option value="by_severity">按 Severity 分组</a-select-option>
                <a-select-option value="flat">不分组</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>权限与轮转</a-divider>
        <a-row :gutter="16">
          <a-col :md="12" :sm="24">
            <a-form-item label="文件权限 (八进制)">
              <a-input v-decorator="['file_mode', { initialValue: '0640' }]" />
            </a-form-item>
          </a-col>
          <a-col :md="12" :sm="24">
            <a-form-item label="目录权限 (八进制)">
              <a-input v-decorator="['dir_mode', { initialValue: '0750' }]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :md="12" :sm="24">
            <a-form-item label="轮转策略">
              <a-select v-decorator="['rotate_policy', { initialValue: 'size' }]" style="width: 100%">
                <a-select-option value="size">按大小轮转</a-select-option>
                <a-select-option value="daily">按天轮转</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :md="12" :sm="24">
            <a-form-item label="轮转阈值">
              <a-input-number v-decorator="['rotate_threshold', { initialValue: 100 }]" :min="1" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :md="12" :sm="24">
            <a-form-item label="保留文件数">
              <a-input-number v-decorator="['rotate_keep', { initialValue: 7 }]" :min="1" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="备注">
          <a-textarea v-decorator="['notes']" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </page-header-wrapper>
</template>

<script>
import {
  listAuditConfigs,
  getAuditConfigDefaults,
  createAuditConfig,
  updateAuditConfig,
  deleteAuditConfig
} from '@/api/audit'

export default {
  name: 'AuditConfig',
  data () {
    return {
      form: this.$form.createForm(this),
      loading: false,
      saving: false,
      modalVisible: false,
      editing: null,
      configs: [],
      severities: ['emerg', 'alert', 'crit', 'err', 'warn', 'notice', 'info', 'debug'],
      columns: [
        { title: '名称', dataIndex: 'source', key: 'source', width: 200 },
        { title: '允许主机', dataIndex: 'allowed_hosts', key: 'allowed_hosts', width: 240 },
        { title: '监听端口', dataIndex: 'listen_ports', key: 'listen_ports', width: 180, scopedSlots: { customRender: 'listen_ports' } },
        { title: '保留天数', dataIndex: 'retention_days', key: 'retention_days', width: 120 },
        { title: '存储目录', dataIndex: 'storage_dir', key: 'storage_dir', width: 200 },
        { title: 'Severity 过滤', dataIndex: 'severity', key: 'severity', width: 180, scopedSlots: { customRender: 'severity' } },
        { title: '存储规则', dataIndex: 'storage_rule', key: 'storage_rule', width: 140 },
        { title: '轮转', dataIndex: 'rotate_policy', key: 'rotate_policy', width: 140 },
        { title: '操作', key: 'action', width: 140, scopedSlots: { customRender: 'action' }, fixed: 'right' }
      ]
    }
  },
  created () {
    this.fetchConfigs()
  },
  methods: {
    async fetchConfigs () {
      this.loading = true
      try {
        const data = await listAuditConfigs()
        this.configs = data.results || data
      } catch (e) {
        const detail = (e.response && e.response.data && e.response.data.detail) || e.message
        this.$notification.error({ message: '加载失败', description: detail })
      } finally {
        this.loading = false
      }
    },
    openModal (record) {
      this.editing = record || null
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.resetFields()
        if (record) {
          this.form.setFieldsValue({ ...record })
        } else {
          this.setDefaults()
        }
      })
    },
    async setDefaults () {
      try {
        const data = await getAuditConfigDefaults()
        this.form.setFieldsValue({ ...data })
      } catch (e) {
        this.form.setFieldsValue({
          listen_ports: ['udp514', 'tcp514'],
          firewall_policy: 'trusted_only',
          retention_days: 30,
          storage_dir: '/var/log/syslog-audit',
          storage_rule: 'by_host',
          file_mode: '0640',
          dir_mode: '0750',
          rotate_policy: 'size',
          rotate_threshold: 100,
          rotate_keep: 7
        })
      }
    },
    handleSave () {
      this.form.validateFields(async (err, values) => {
        if (err) return
        this.saving = true
        try {
          if (this.editing) {
            await updateAuditConfig(this.editing.id, values)
          } else {
            await createAuditConfig(values)
          }
          this.$message.success('已保存')
          this.modalVisible = false
          this.fetchConfigs()
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
      deleteAuditConfig(record.id)
        .then(() => {
          this.$message.success('已删除')
          this.fetchConfigs()
        })
        .catch(e => {
          const detail = (e.response && e.response.data && e.response.data.detail) || e.message
          this.$notification.error({ message: '删除失败', description: detail })
        })
    }
  }
}
</script>
