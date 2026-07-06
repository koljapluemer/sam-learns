import 'mathlive'
import 'mathlive/static.css'
import 'mathlive/fonts.css'
import 'katex/dist/katex.min.css'
import type { VirtualKeyboardInterface } from 'mathlive'
import { commonExerciseVariables } from '@/apps/simplify-expressions/entities/expression-exercise/exerciseVariables'

const mathVirtualKeyboard = window.mathVirtualKeyboard as VirtualKeyboardInterface | undefined

if (mathVirtualKeyboard) {
  mathVirtualKeyboard.layouts = [
    {
      label: 'basic',
      rows: [
        ['[+]', '[-]', '[*]', '[/]', '[=]', '[.]', '[(]', '[)]', '\\sqrt{#0}', '#@^{#?}'],
        ['[1]', '[2]', '[3]', '[4]', '[5]', '[6]', '[7]', '[8]', '[9]', '[0]'],
        [
          ...commonExerciseVariables,
          '[separator]',
          '[left]',
          '[right]',
          { label: '[backspace]', class: 'action hide-shift' }
        ]
      ]
    }
  ]
  mathVirtualKeyboard.editToolbar = 'none'
}
