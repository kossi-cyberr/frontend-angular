import { TestBed } from '@angular/core/testing';

import { EnServiceService } from './en-service.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('EnServiceService', () => {
  let service: EnServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    service = TestBed.inject(EnServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
