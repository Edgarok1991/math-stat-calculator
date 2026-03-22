import { CalculusService } from './calculus.service';

describe('CalculusService integral', () => {
  const service = new CalculusService();

  it('integrates (x^2+1)/(x+3) with polynomial division and structured steps', () => {
    const r = service.calculateIntegral({
      expression: '(x^2+1)/(x+3)',
      variable: 'x',
      type: 'integral',
    });
    expect(r.result).toContain('log');
    expect(r.result).not.toContain('Не удалось');
    expect(r.latex).not.toContain('не элементарно');
    expect(r.stepsStructured?.length).toBeGreaterThan(1);
    expect(r.stepsStructured?.some((s) => s.rule?.name?.includes('Рациональная дробь'))).toBe(true);
  });

  it('handles double parentheses around numerator/denominator', () => {
    const r = service.calculateIntegral({
      expression: '((x^2+1))/((x+3))',
      variable: 'x',
      type: 'integral',
    });
    expect(r.result).toContain('log');
    expect(r.result).not.toContain('Не удалось');
  });
});
