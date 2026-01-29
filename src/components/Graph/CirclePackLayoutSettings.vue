<template>
  <Field label="层级属性" fieldContainerClassName="multiselect-field">
    <multiselect
      :modelValue="modelValue.hierarchyAttributes"
      class="sqliteviz-select"
      :options="keyOptions"
      :multiple="true"
      :hideSelected="true"
      :closeOnSelect="true"
      :showLabels="false"
      :max="keyOptions.length"
      placeholder=""
      openDirection="bottom"
      @update:model-value="update('hierarchyAttributes', $event)"
    >
      <template #maxElements>
        <span class="no-results">无结果</span>
      </template>

      <template #placeholder>选择一个选项</template>

      <template #noResult>
        <span class="no-results">无结果</span>
      </template>
    </multiselect>
  </Field>

  <Field label="种子值">
    <NumericInput
      :value="modelValue.seedValue"
      @update="update('seedValue', $event)"
    />
  </Field>
</template>

<script>
import { applyPureReactInVue } from 'veaury'
import Field from 'react-chart-editor/lib/components/fields/Field'
import NumericInput from 'react-chart-editor/lib/components/widgets/NumericInput'
import Multiselect from 'vue-multiselect'
import 'react-chart-editor/lib/react-chart-editor.css'

export default {
  components: {
    Field: applyPureReactInVue(Field),
    NumericInput: applyPureReactInVue(NumericInput),
    Multiselect
  },
  props: {
    modelValue: Object,
    keyOptions: Array
  },
  emits: ['update:modelValue'],
  methods: {
    update(attributeName, value) {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        [attributeName]: value
      })
    }
  }
}
</script>

<style scoped>
:deep(.sqliteviz-select.multiselect--active .multiselect__input) {
  width: 100% !important;
}
:deep(.multiselect-field .field__widget > *) {
  flex-grow: 1 !important;
}
</style>
