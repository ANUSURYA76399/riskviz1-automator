import React, { useState } from "react"
import * as RadixToggleGroup from "@radix-ui/react-toggle-group"

const ToggleGroup = RadixToggleGroup.Root
const ToggleGroupItem = RadixToggleGroup.Item

export { ToggleGroup, ToggleGroupItem }

function ExampleToggleGroup() {
  const [value, setValue] = useState("option1")
  return (
    <ToggleGroup type="single" value={value} onValueChange={setValue}>
      <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
      <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
    </ToggleGroup>
  )
}