# Combobox Component - Usage Guide

## Overview
The Combobox component is a searchable, keyboard-accessible dropdown that combines the functionality of a select element with text input filtering.

---

## Basic Usage

```tsx
import Combobox from '@/components/Combobox'

function MyForm() {
  const [selectedValue, setSelectedValue] = useState('')
  
  const options = [
    { value: 'hue', label: 'Thừa Thiên Huế' },
    { value: 'danang', label: 'Đà Nẵng' },
    { value: 'quangnam', label: 'Quảng Nam' },
  ]

  return (
    <Combobox
      options={options}
      value={selectedValue}
      onChange={setSelectedValue}
      placeholder="Chọn tỉnh/thành..."
      required
    />
  )
}
```

---

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `options` | `ComboboxOption[]` | ✅ Yes | - | Array of options to display |
| `value` | `string` | ✅ Yes | - | Currently selected value |
| `onChange` | `(value: string) => void` | ✅ Yes | - | Callback when selection changes |
| `placeholder` | `string` | ❌ No | `'Chọn...'` | Placeholder text when empty |
| `required` | `boolean` | ❌ No | `false` | HTML required attribute |
| `disabled` | `boolean` | ❌ No | `false` | Disable the combobox |
| `className` | `string` | ❌ No | `''` | Additional CSS classes |

### ComboboxOption Type
```typescript
interface ComboboxOption {
  value: string  // Internal value (stored in database)
  label: string  // Display text (shown to user)
}
```

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↓` Arrow Down | Move to next option (opens dropdown if closed) |
| `↑` Arrow Up | Move to previous option |
| `Enter` | Select highlighted option and close |
| `Escape` | Close dropdown and clear search |
| `Tab` | Close dropdown and move to next field |
| Any letter/number | Start searching/filtering |

---

## Mouse Interaction

- **Click input**: Opens dropdown
- **Type in input**: Filters options in real-time
- **Click option**: Selects and closes dropdown
- **Hover option**: Highlights the option
- **Click outside**: Closes dropdown

---

## Features

### 1. Search/Filter
Type to filter options by label (case-insensitive):
```tsx
// User types "huế"
// Shows: "Thừa Thiên Huế"
// Hides: "Đà Nẵng", "Quảng Nam"
```

### 2. Visual Feedback
- **Highlighted option**: Blue background (keyboard/mouse hover)
- **Selected option**: Light blue background
- **Dropdown arrow**: Rotates when open
- **No results**: Shows "Không tìm thấy kết quả"

### 3. Accessibility
- Keyboard navigation follows ARIA best practices
- Auto-scroll keeps highlighted item visible
- Focus management (blur on selection)
- Click-outside detection

---

## Examples

### Example 1: Province Selection
```tsx
<Combobox
  options={provinces}
  value={province}
  onChange={setProvince}
  placeholder="Chọn tỉnh/thành..."
  required
/>
```

### Example 2: Provider Type Selection
```tsx
<Combobox
  options={providerTypeOptions}
  value={kind}
  onChange={setKind}
  disabled={isEdit}
  required
/>
```

### Example 3: Dynamic Options from Firestore
```tsx
const [options, setOptions] = useState([])

useEffect(() => {
  const loadOptions = async () => {
    const snap = await getDocs(collection(db, 'master_provinces'))
    const data = snap.docs.map((doc) => ({
      value: doc.data().name,
      label: doc.data().name,
    }))
    setOptions(data.sort((a, b) => a.label.localeCompare(b.label)))
  }
  loadOptions()
}, [])

return (
  <Combobox
    options={options}
    value={selected}
    onChange={setSelected}
  />
)
```

---

## Styling

The component uses Tailwind CSS classes. Default styling:
- Input: `border-gray-300`, `focus:ring-blue-500`
- Dropdown: `shadow-lg`, `max-h-60` (scrollable)
- Highlighted: `bg-blue-100`, `text-blue-900`
- Selected: `bg-blue-50`, `text-blue-700`

### Custom Styling
```tsx
<Combobox
  className="my-custom-class"
  // ... other props
/>
```

---

## Best Practices

### 1. Sort Options
Always sort options alphabetically for better UX:
```tsx
const sortedOptions = options.sort((a, b) => 
  a.label.localeCompare(b.label)
)
```

### 2. Loading State
Show loading state while fetching options:
```tsx
{loading ? (
  <p>Đang tải...</p>
) : (
  <Combobox options={options} ... />
)}
```

### 3. Empty State
Handle empty options array:
```tsx
{options.length === 0 ? (
  <p>Chưa có dữ liệu</p>
) : (
  <Combobox options={options} ... />
)}
```

### 4. Form Integration
Use with form validation:
```tsx
<form onSubmit={handleSubmit}>
  <Combobox
    options={options}
    value={value}
    onChange={setValue}
    required  // HTML5 validation
  />
  <button type="submit">Submit</button>
</form>
```

---

## Troubleshooting

### Issue: Dropdown doesn't close on click outside
**Solution**: Ensure the component is properly mounted and not inside a portal.

### Issue: Keyboard navigation not working
**Solution**: Check that the input has focus. Click the input first.

### Issue: Options not filtering
**Solution**: Verify that `label` property exists on all options.

### Issue: Selected value not displaying
**Solution**: Ensure `value` prop matches one of the option `value` properties exactly.

---

## Performance Tips

1. **Memoize options**: Use `useMemo` for expensive option transformations
2. **Debounce search**: For very large lists (>1000 items)
3. **Virtual scrolling**: Consider for extremely large lists
4. **Lazy loading**: Load options on first open, not on mount

---

## Comparison with Native Select

| Feature | Combobox | Native Select |
|---------|----------|---------------|
| Search/Filter | ✅ Yes | ❌ No |
| Keyboard Nav | ✅ Enhanced | ✅ Basic |
| Styling | ✅ Full control | ⚠️ Limited |
| Mobile UX | ✅ Consistent | ⚠️ OS-dependent |
| Accessibility | ✅ ARIA | ✅ Native |
| Performance | ⚠️ Good (<1000) | ✅ Excellent |

---

## Related Components

- **Select**: Use for simple, small lists (<10 items)
- **Autocomplete**: Use for async search with API calls
- **Multiselect**: Use for selecting multiple values
- **Combobox**: Use for searchable single selection

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11: Not supported (uses modern JS features)

---

## License

Part of the SoTayChoHDV project. See main LICENSE file.
