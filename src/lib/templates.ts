export type CardTemplate = {
  id: string;
  name: string;
  image: string;
};

export const CARD_TEMPLATES: CardTemplate[] = [
  { id: "thanks", name: "ありがとう", image: "/templates/thanks.svg" },
  { id: "birthday", name: "お誕生日", image: "/templates/birthday.svg" },
  { id: "congrats", name: "おめでとう", image: "/templates/congrats.svg" },
  { id: "coffee", name: "コーヒー1杯", image: "/templates/coffee.svg" },
];

export function getTemplate(id: string): CardTemplate | undefined {
  return CARD_TEMPLATES.find((t) => t.id === id);
}

export const MAX_MESSAGE_LENGTH = 200;
