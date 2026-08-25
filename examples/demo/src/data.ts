export type TreeItem = {
  id: string;
  name: string;
  kind: "plant" | "line" | "machine" | "sensor";
  alerts: number;
  children?: TreeItem[];
};

const KINDS: TreeItem["kind"][] = ["plant", "line", "machine", "sensor"];

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

export function buildTree(plants: number, linesPerPlant: number, machinesPerLine: number, sensorsPerMachine: number) {
  const random = seededRandom(20260820);
  let count = 0;

  const node = (depth: number, path: string, index: number): TreeItem => {
    const kind = KINDS[depth];
    count += 1;
    return {
      id: `${path}-${index}`,
      name: `${kind} ${path}-${index}`,
      kind,
      alerts: random() < 0.18 ? 1 + Math.floor(random() * 12) : 0,
    };
  };

  const items: TreeItem[] = [];
  for (let p = 0; p < plants; p += 1) {
    const plant = node(0, "P", p);
    plant.children = [];
    for (let l = 0; l < linesPerPlant; l += 1) {
      const line = node(1, plant.id, l);
      line.children = [];
      for (let m = 0; m < machinesPerLine; m += 1) {
        const machine = node(2, line.id, m);
        machine.children = [];
        for (let s = 0; s < sensorsPerMachine; s += 1) {
          machine.children.push(node(3, machine.id, s));
        }
        line.children.push(machine);
      }
      plant.children.push(line);
    }
    items.push(plant);
  }

  return { items, count };
}

export function collectIds(items: TreeItem[], depthLimit: number, depth = 0): string[] {
  if (depth > depthLimit) {
    return [];
  }
  return items.flatMap((item) => [item.id, ...(item.children ? collectIds(item.children, depthLimit, depth + 1) : [])]);
}
