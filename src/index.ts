import './styles.css'
import { Select } from './select'
import { selectOptions } from './data'

// init select
window.addEventListener('load', function () {
  const comboboxSelect: NodeListOf<HTMLElement> = document.querySelectorAll('.combo__select')

  comboboxSelect.forEach((element) => {
    const comboboxElement = element.querySelector('[role=combobox]')
    const listboxElement = element.querySelector('[role=listbox]')

    new Select(
      {
        element,
        comboboxElement: comboboxElement as HTMLElement,
        listboxElement: listboxElement as HTMLElement,
      },
      selectOptions
    )
  })
})
