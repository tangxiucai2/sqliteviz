<template>
  <Field label="缩放比例" fieldContainerClassName="test_fa2_scaling">
    <NumericInput
      :value="modelValue.scalingRatio"
      @update="update('scalingRatio', $event)"
    />
  </Field>

  <Field
    label="防止重叠"
    fieldContainerClassName="test_fa2_adjustSizes"
  >
    <RadioBlocks
      :options="booleanOptions"
      :activeOption="modelValue.adjustSizes"
      @option-change="update('adjustSizes', $event)"
    />
  </Field>

  <Field
    label="Barnes-Hut优化"
    fieldContainerClassName="test_fa2_barnes_hut"
  >
    <RadioBlocks
      :options="booleanOptions"
      :activeOption="modelValue.barnesHutOptimize"
      @option-change="update('barnesHutOptimize', $event)"
    />
  </Field>

  <Field
    v-show="modelValue.barnesHutOptimize"
    label="Barnes-Hut参数"
    fieldContainerClassName="test_fa2_barnes_theta"
  >
    <NumericInput
      :value="modelValue.barnesHutTheta"
      @update="update('barnesHutTheta', $event)"
    />
  </Field>

  <Field
    label="强重力模式"
    fieldContainerClassName="test_fa2_strong_gravity"
  >
    <RadioBlocks
      :options="booleanOptions"
      :activeOption="modelValue.strongGravityMode"
      @option-change="update('strongGravityMode', $event)"
    />
  </Field>

  <Field
    label="Noack LinLog模型"
    fieldContainerClassName="test_fa2_lin_log"
  >
    <RadioBlocks
      :options="booleanOptions"
      :activeOption="modelValue.linLogMode"
      @option-change="update('linLogMode', $event)"
    />
  </Field>

  <Field
    label="外向吸引力分布"
    fieldContainerClassName="test_fa2_outbound_attraction"
  >
    <RadioBlocks
      :options="booleanOptions"
      :activeOption="modelValue.outboundAttractionDistribution"
      @option-change="update('outboundAttractionDistribution', $event)"
    />
  </Field>

  <Field label="减速系数" fieldContainerClassName="test_fa2_slow_down">
    <NumericInput
      :value="modelValue.slowDown"
      :min="0"
      @update="update('slowDown', $event)"
    />
  </Field>

  <Field label="边权重">
    <Dropdown
      :options="keyOptions"
      :value="modelValue.weightSource"
      className="test_fa2_weight_source"
      @change="update('weightSource', $event)"
    />
  </Field>
  <Field
    v-show="modelValue.weightSource"
    label="边权重影响"
    fieldContainerClassName="test_fa2_weight_influence"
  >
    <NumericInput
      :value="modelValue.edgeWeightInfluence"
      @update="update('edgeWeightInfluence', $event)"
    />
  </Field>
</template>

<script>
import { markRaw } from 'vue'
import { applyPureReactInVue } from 'veaury'
import Field from 'react-chart-editor/lib/components/fields/Field'
import RadioBlocks from 'react-chart-editor/lib/components/widgets/RadioBlocks'
import NumericInput from 'react-chart-editor/lib/components/widgets/NumericInput'
import Dropdown from 'react-chart-editor/lib/components/widgets/Dropdown'
import 'react-chart-editor/lib/react-chart-editor.css'

export default {
  components: {
    Field: applyPureReactInVue(Field),
    RadioBlocks: applyPureReactInVue(RadioBlocks),
    Dropdown: applyPureReactInVue(Dropdown),
    NumericInput: applyPureReactInVue(NumericInput)
  },
  props: {
    modelValue: Object,
    keyOptions: Array
  },
  emits: ['update:modelValue'],
  data() {
    return {
      booleanOptions: markRaw([
        { label: 'Yes', value: true },
        { label: 'No', value: false }
      ])
    }
  },
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
