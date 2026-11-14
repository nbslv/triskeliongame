/**
 * Busca de caminho A* em grade de tiles (4 direções), pura e testável.
 * Usada pelo passo `move` dos roteiros para contornar árvores, paredes etc.
 */
export interface Cell {
  x: number;
  y: number;
}

/**
 * Caminho de `from` até `to` (inclusive), ou null se não houver.
 * `blocked(x, y)` diz se o tile é sólido; o tile de destino pode ser sólido (o ator para ao lado? não: retorna null).
 * `maxNodes` limita a busca em mapas grandes.
 */
export function findPath(
  from: Cell,
  to: Cell,
  width: number,
  height: number,
  blocked: (x: number, y: number) => boolean,
  maxNodes = 20000,
): Cell[] | null {
  if (from.x === to.x && from.y === to.y) return [from];
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height;
  if (!inside(to.x, to.y) || blocked(to.x, to.y)) return null;
  const key = (x: number, y: number) => y * width + x;
  const h = (x: number, y: number) => Math.abs(x - to.x) + Math.abs(y - to.y);
  const g = new Map<number, number>([[key(from.x, from.y), 0]]);
  const came = new Map<number, number>();
  // fila de prioridade simples (heap binário) por f = g + h
  const heap: [number, number, number][] = [[h(from.x, from.y), from.x, from.y]];
  const push = (item: [number, number, number]) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p]![0] <= heap[i]![0]) break;
      [heap[p], heap[i]] = [heap[i]!, heap[p]!];
      i = p;
    }
  };
  const pop = (): [number, number, number] => {
    const top = heap[0]!;
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l;
        if (r < heap.length && heap[r]![0] < heap[m]![0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i]!, heap[m]!];
        i = m;
      }
    }
    return top;
  };
  let visited = 0;
  while (heap.length) {
    const [, x, y] = pop();
    if (x === to.x && y === to.y) {
      const path: Cell[] = [];
      let k: number | undefined = key(x, y);
      while (k !== undefined) {
        path.unshift({ x: k % width, y: Math.floor(k / width) });
        k = came.get(k);
      }
      return path;
    }
    if (++visited > maxNodes) return null;
    const gc = g.get(key(x, y))!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (!inside(nx, ny) || blocked(nx, ny)) continue;
      const nk = key(nx, ny);
      const ng = gc + 1;
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng);
        came.set(nk, key(x, y));
        push([ng + h(nx, ny), nx, ny]);
      }
    }
  }
  return null;
}

/** Remove pontos intermediários em linha reta (só os cantos interessam). */
export function simplifyPath(path: Cell[]): Cell[] {
  if (path.length <= 2) return path;
  const out: Cell[] = [path[0]!];
  for (let i = 1; i < path.length - 1; i++) {
    const a = out[out.length - 1]!;
    const b = path[i]!;
    const c = path[i + 1]!;
    const collinear = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
    if (!collinear) out.push(b);
  }
  out.push(path[path.length - 1]!);
  return out;
}
