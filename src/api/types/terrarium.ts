export interface Accessory {
  accessoryId: number;
  name: string;
  description: string;
  price: number;
}

export interface Terrarium {
  terrariumId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: string;
  environments: string[];
  shapes: string[];
  tankMethods: string[];
  accessories: Accessory[];
  createdAt: string;
  updatedAt: string;
  bodyHTML: string;
  terrariumImages: { url: string }[];
}
