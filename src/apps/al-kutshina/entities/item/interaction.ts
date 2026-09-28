import { canReceive, Reaction, type Item } from './item'

// One slot on the board. `img` is '' for an empty slot (or once the card is gone).
export type Field = { id: string; img: string; overlayImg?: string }

export function actionsBetween(sender: Item, receiver: Item): string[] {
  return sender.capabilities.map(([action]) => action).filter((action) => canReceive(receiver, action))
}

function senderAfter(sender: Field, senderItem: Item, action: string): Field {
  const reaction = senderItem.capabilities.find(([name]) => name === action)?.[1]
  return reaction === Reaction.Disappear ? { ...sender, img: '' } : sender
}

function receiverAfter(sender: Field, receiver: Field, receiverItem: Item, action: string): Field {
  const [, reaction, target] = receiverItem.affordances.find(([name]) => name === action) ?? []
  switch (reaction) {
    case Reaction.Disappear:
      return { ...receiver, img: '' }
    case Reaction.ChangeTo:
      return target ? { ...receiver, img: target } : receiver
    case Reaction.AddImage:
      return { ...receiver, overlayImg: sender.img }
    default:
      return receiver
  }
}

export function applyAction(
  sender: Field,
  receiver: Field,
  senderItem: Item,
  receiverItem: Item,
  action: string
): { sender: Field; receiver: Field } {
  return {
    sender: senderAfter(sender, senderItem, action),
    receiver: receiverAfter(sender, receiver, receiverItem, action)
  }
}
