import { sugerirSlug } from './category-slug';

describe('sugerirSlug', () => {
  it('passa para minúsculas', () => {
    expect(sugerirSlug('Limpeza')).toBe('limpeza');
  });

  it('remove acentos em vez de descartar a letra', () => {
    expect(sugerirSlug('Manutenção Elétrica')).toBe('manutencao-eletrica');
    expect(sugerirSlug('Alimentação')).toBe('alimentacao');
  });

  it('junta separadores seguidos num único hífen', () => {
    expect(sugerirSlug('Ar   &   Água')).toBe('ar-agua');
  });

  it('não deixa hífen nas pontas', () => {
    expect(sugerirSlug('  Pintura!  ')).toBe('pintura');
    expect(sugerirSlug('---Reformas---')).toBe('reformas');
  });

  it('mantém números', () => {
    expect(sugerirSlug('Serviços 24h')).toBe('servicos-24h');
  });

  it('respeita o teto de 120 caracteres do back-end', () => {
    const slug = sugerirSlug('a'.repeat(200));

    expect(slug).toHaveLength(120);
  });

  // Cortar em 120 pode cair no meio de um separador e deixar o slug terminando
  // em hífen, que é feio e não é o que o admin digitaria.
  it('não termina em hífen quando o corte cai num separador', () => {
    const nome = `${'a'.repeat(119)} fim`;

    const slug = sugerirSlug(nome);

    expect(slug.endsWith('-')).toBe(false);
    expect(slug).toBe('a'.repeat(119));
  });

  it('devolve vazio quando não sobra nada aproveitável', () => {
    expect(sugerirSlug('!!!')).toBe('');
    expect(sugerirSlug('')).toBe('');
  });
});
