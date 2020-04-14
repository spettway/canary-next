import React, { useState } from 'react';
import { Input, Select } from 'antd';

const { Option } = Select;

interface PayValue {
  amount?: number
  other?: string
  type?: 'none' | 'hourly' | 'monthly' | 'stipend' | 'other'
}

interface PayInput {
  value?: PayValue;
  onChange?: (value: PayValue) => void;
}

const PayInput: React.FC<PayInput> = ({ value = {}, onChange }) => {
  const [amount, setAmount] = useState(0);
  const [other, setOther] = useState('');
  const [type, setType] = useState(value.type || 'hourly');

  const triggerChange = changedValue => {
    if (onChange) {
      onChange({ amount, type, other, ...value, ...changedValue });
    }
  };

  const onNumberChange = e => {
    if (value.type === 'other') {
      setOther(e.target.value)
      triggerChange({ other: e.target.value})
      return;
    }
    const newAmount = parseInt(e.target.value || 0, 10);
    if (Number.isNaN(amount)) {
      return;
    }
    if (!('number' in value)) {
      setAmount(newAmount);
    }
    triggerChange({ amount: newAmount });
  };

  const onpayTypeChange = newType => {
    if (!('payType' in value)) {
      setType(newType);
    }
    triggerChange({ type: newType });
  };

  return (
    <span>
      <Input
        type="text"
        value={value.type !== 'other' ? (value.amount || amount) : other}
        onChange={onNumberChange}
        style={{ width: value.type !== 'other' ? 100 : 300 }}
        disabled={type === 'none'}
        prefix={value.type !== 'other' && "$"}
        placeholder={value.type !== 'other' ? undefined : "Describe compensation" }/>
      <Select
        value={value.type || type}
        style={{ width: 100, margin: '0 8px' }}
        onChange={onpayTypeChange}>
        <Option value="none">None</Option>
        <Option value="hourly">Hourly</Option>
        <Option value="monthly">Monthly</Option>
        <Option value="stipend">Stipend</Option>
        <Option value="other">Other</Option>
      </Select>
    </span>
  );
};

export default PayInput