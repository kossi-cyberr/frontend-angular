import { TestBed } from '@angular/core/testing';

import { ApplicationGuard } from './application.guard';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('ApplicationGuard', () => {
  let guard: ApplicationGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    guard = TestBed.inject(ApplicationGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
