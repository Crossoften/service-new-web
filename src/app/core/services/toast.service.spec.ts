import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add success toast', () => {
    service.showSuccess('Test message');
    expect(service.getToasts().length).toBe(1);
    expect(service.getToasts()[0].type).toBe('success');
  });

  it('should add error toast', () => {
    service.showError('Error message');
    expect(service.getToasts().length).toBe(1);
    expect(service.getToasts()[0].type).toBe('error');
  });

  it('should remove toast by id', () => {
    service.showSuccess('Test');
    const toastId = service.getToasts()[0].id;
    service.remove(toastId);
    expect(service.getToasts().length).toBe(0);
  });

  it('should clear all toasts', () => {
    service.showSuccess('Test 1');
    service.showError('Test 2');
    service.clear();
    expect(service.getToasts().length).toBe(0);
  });

  it('should auto-remove toast after duration', (done) => {
    service.showSuccess('Test', 100);
    expect(service.getToasts().length).toBe(1);

    setTimeout(() => {
      expect(service.getToasts().length).toBe(0);
      done();
    }, 150);
  });
});
