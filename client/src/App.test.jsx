import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

const MOCK_VEHICLES = {
  ford: {
    Ranger: ['Raptor', 'Wildtrak'],
    Falcon: ['XR6', 'XR8'],
  },
  bmw: {
    '130d': ['xDrive 26d'],
  },
  tesla: {
    'Model 3': ['Performance', 'Long Range'],
  },
};

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('App', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads vehicle options and renders formatted makes with downstream selects disabled', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(MOCK_VEHICLES));

    render(<App />);

    expect(screen.getByText(/loading vehicle options/i)).toBeInTheDocument();

    const makeSelect = await screen.findByLabelText(/make/i);
    const modelSelect = screen.getByLabelText(/model/i);
    const badgeSelect = screen.getByLabelText(/badge/i);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/vehicles',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(screen.getByRole('option', { name: 'Ford' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'BMW' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tesla' })).toBeInTheDocument();

    expect(makeSelect).toBeEnabled();
    expect(modelSelect).toBeDisabled();
    expect(badgeSelect).toBeDisabled();
    expect(screen.queryByLabelText(/service logbook/i)).not.toBeInTheDocument();
  });

  it('shows an error alert when loading vehicles fails and retries on click', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockReturnValueOnce(jsonResponse({}, { ok: false, status: 500 }))
      .mockReturnValueOnce(jsonResponse(MOCK_VEHICLES));

    render(<App />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/failed to load vehicles \(500\)/i);

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByLabelText(/make/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('cascades selections, reveals upload on badge selection, and resets downstream state on upstream change', async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValueOnce(jsonResponse(MOCK_VEHICLES));

    render(<App />);

    const makeSelect = await screen.findByLabelText(/make/i);
    const modelSelect = screen.getByLabelText(/model/i);
    const badgeSelect = screen.getByLabelText(/badge/i);

    await user.selectOptions(makeSelect, 'ford');
    expect(modelSelect).toBeEnabled();
    expect(badgeSelect).toBeDisabled();

    await user.selectOptions(modelSelect, 'Ranger');
    expect(badgeSelect).toBeEnabled();
    expect(screen.queryByLabelText(/service logbook/i)).not.toBeInTheDocument();

    await user.selectOptions(badgeSelect, 'Raptor');
    expect(screen.getByLabelText(/service logbook/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();

    // Changing model clears badge and hides upload section
    await user.selectOptions(modelSelect, 'Falcon');
    expect(badgeSelect).toHaveValue('');
    expect(screen.queryByLabelText(/service logbook/i)).not.toBeInTheDocument();

    // Changing make clears both model and badge
    await user.selectOptions(makeSelect, 'tesla');
    expect(modelSelect).toHaveValue('');
    expect(badgeSelect).toBeDisabled();
  });

  it('rejects non-plain-text logbook files and keeps submit disabled', async () => {
    const user = userEvent.setup({ applyAccept: false });
    fetchMock.mockReturnValueOnce(jsonResponse(MOCK_VEHICLES));

    render(<App />);

    await user.selectOptions(await screen.findByLabelText(/make/i), 'ford');
    await user.selectOptions(screen.getByLabelText(/model/i), 'Ranger');
    await user.selectOptions(screen.getByLabelText(/badge/i), 'Raptor');

    const fileInput = screen.getByLabelText(/service logbook/i);
    const pdfFile = new File(['%PDF-1.4'], 'logbook.pdf', {
      type: 'application/pdf',
    });

    await user.upload(fileInput, pdfFile);

    expect(screen.getByRole('alert')).toHaveTextContent(
      /please attach a plain text logbook file/i,
    );
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('accepts plain-text files with .log or no extension and empty MIME type', async () => {
    const user = userEvent.setup({ applyAccept: false });
    fetchMock.mockReturnValueOnce(jsonResponse(MOCK_VEHICLES));

    render(<App />);

    await user.selectOptions(await screen.findByLabelText(/make/i), 'ford');
    await user.selectOptions(screen.getByLabelText(/model/i), 'Ranger');
    await user.selectOptions(screen.getByLabelText(/badge/i), 'Raptor');

    const fileInput = screen.getByLabelText(/service logbook/i);
    const logFile = new File(['Service entry'], 'service.log', { type: '' });

    await user.upload(fileInput, logFile);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
  });

  it('rejects logbook files larger than 5 MB client-side', async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValueOnce(jsonResponse(MOCK_VEHICLES));

    render(<App />);

    await user.selectOptions(await screen.findByLabelText(/make/i), 'ford');
    await user.selectOptions(screen.getByLabelText(/model/i), 'Ranger');
    await user.selectOptions(screen.getByLabelText(/badge/i), 'Raptor');

    const fileInput = screen.getByLabelText(/service logbook/i);
    const largeFile = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      'huge.txt',
      { type: 'text/plain' },
    );

    await user.upload(fileInput, largeFile);

    expect(screen.getByRole('alert')).toHaveTextContent(/5 mb or smaller/i);
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('allows empty (0-byte) logbook files and renders an empty-file placeholder', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockReturnValueOnce(jsonResponse(MOCK_VEHICLES))
      .mockReturnValueOnce(
        jsonResponse({
          make: 'ford',
          model: 'Ranger',
          badge: 'Raptor',
          logbook: {
            fileName: 'empty.txt',
            size: 0,
            content: '',
          },
        }),
      );

    render(<App />);

    await user.selectOptions(await screen.findByLabelText(/make/i), 'ford');
    await user.selectOptions(screen.getByLabelText(/model/i), 'Ranger');
    await user.selectOptions(screen.getByLabelText(/badge/i), 'Raptor');

    const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText(/service logbook/i), emptyFile);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeEnabled();
    fireEvent.submit(submitButton.form);

    expect(
      await screen.findByRole('heading', { name: /submission received/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('(Empty file)')).toBeInTheDocument();
  });

  it('submits the selected vehicle and logbook file and displays the response summary', async () => {
    const user = userEvent.setup();
    const logbookContent = '2025-01-15: 15,000km service completed.';

    fetchMock
      .mockReturnValueOnce(jsonResponse(MOCK_VEHICLES))
      .mockReturnValueOnce(
        jsonResponse({
          make: 'bmw',
          model: '130d',
          badge: 'xDrive 26d',
          logbook: {
            fileName: 'service.txt',
            size: logbookContent.length,
            content: logbookContent,
          },
        }),
      );

    render(<App />);

    await user.selectOptions(await screen.findByLabelText(/make/i), 'bmw');
    await user.selectOptions(screen.getByLabelText(/model/i), '130d');
    await user.selectOptions(screen.getByLabelText(/badge/i), 'xDrive 26d');

    const txtFile = new File([logbookContent], 'service.txt', {
      type: 'text/plain',
    });
    await user.upload(screen.getByLabelText(/service logbook/i), txtFile);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeEnabled();
    // jsdom's native constraint validation doesn't see files set via userEvent.upload
    fireEvent.submit(submitButton.form);

    expect(
      await screen.findByRole('heading', { name: /submission received/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/service\.txt/i)).toBeInTheDocument();
    expect(screen.getByText(logbookContent)).toBeInTheDocument();

    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe('/api/submissions');
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get('make')).toBe('bmw');
    expect(options.body.get('model')).toBe('130d');
    expect(options.body.get('badge')).toBe('xDrive 26d');
    expect(options.body.get('logbook')).toBe(txtFile);
  });

  it('displays server error message when submission fails', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockReturnValueOnce(jsonResponse(MOCK_VEHICLES))
      .mockReturnValueOnce(
        jsonResponse(
          { error: 'Logbook file is too large.' },
          {
            ok: false,
            status: 400,
          },
        ),
      );

    render(<App />);

    await user.selectOptions(await screen.findByLabelText(/make/i), 'tesla');
    await user.selectOptions(screen.getByLabelText(/model/i), 'Model 3');
    await user.selectOptions(screen.getByLabelText(/badge/i), 'Performance');

    const txtFile = new File(['entry'], 'service.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText(/service logbook/i), txtFile);
    fireEvent.submit(screen.getByRole('button', { name: /submit/i }).form);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Logbook file is too large.',
    );
  });
});
