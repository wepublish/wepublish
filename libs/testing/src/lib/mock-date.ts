const currentDate = new Date('2023-01-01');
const realDate = Date;

export const mockDate = () => {
  global.Date = class extends Date {
    constructor(date: any) {
      if (date) {
        //@ts-expect-error we are mocking here
        return super(date);
      }

      return currentDate;
    }
  } as any;
};

export const unmockDate = () => {
  global.Date = realDate;
};

export const addDateMock = () => {
  beforeAll(() => {
    mockDate();
  });

  afterAll(() => {
    unmockDate();
  });
};
