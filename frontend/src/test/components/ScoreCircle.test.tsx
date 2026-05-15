import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScoreCircle } from '../../components/ScoreCircle';

describe('ScoreCircle', () => {
  it('renderiza el grade y score', () => {
    render(<ScoreCircle score={64} grade="D" />);
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('64/100')).toBeInTheDocument();
    expect(screen.getByText('SECURITY SCORE')).toBeInTheDocument();
  });

  it('renderiza grade A con color verde', () => {
    render(<ScoreCircle score={95} grade="A" />);
    const grade = screen.getByText('A');
    expect(grade).toHaveAttribute('fill', '#4ade80');
  });

  it('renderiza grade F con color rojo', () => {
    render(<ScoreCircle score={25} grade="F" />);
    const grade = screen.getByText('F');
    expect(grade).toHaveAttribute('fill', '#dc2626');
  });

  it('muestra tooltip al hacer hover en el boton info', async () => {
    const user = userEvent.setup();
    render(<ScoreCircle score={64} grade="D" />);

    const infoBtn = screen.getByLabelText('Score methodology info');
    await user.hover(infoBtn);
    expect(screen.getByText(/Cada header de seguridad tiene un peso/)).toBeInTheDocument();
  });

  it('oculta tooltip al sacar el hover', async () => {
    const user = userEvent.setup();
    render(<ScoreCircle score={64} grade="D" />);

    const infoBtn = screen.getByLabelText('Score methodology info');
    await user.hover(infoBtn);
    expect(screen.getByText(/Cada header de seguridad tiene un peso/)).toBeInTheDocument();

    await user.unhover(infoBtn);
    expect(screen.queryByText(/Cada header de seguridad tiene un peso/)).not.toBeInTheDocument();
  });
});
