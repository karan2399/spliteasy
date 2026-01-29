export type Person = {
    id: string;
    name: string;
};

export type Item = {
    id: string;
    name: string;
    price: number;
    quantity: number;   
    taxPercent: number;
    sharedBy: string[];
  };
  