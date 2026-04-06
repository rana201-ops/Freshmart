const catalog = {
  "fresh-fruits": {
    title: "Fresh Fruits",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e",
    subCategories: {
      fruits: [
        { id: 1, name: "Apple", price: 120, image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6" },
        { id: 2, name: "Orange", price: 40, image: "https://images.unsplash.com/photo-1547514701-42782101795e" },
      ],
      berries: [
        { id: 3, name: "Strawberry", price: 150, image: "https://images.unsplash.com/photo-1582281298057-9b1f69c7c8a2" },
      ],
    },
  },
  "green-vegetables": {
    title: "Green Vegetables",
    image: "https://bettervitamin.com/wp-content/uploads/2013/07/vegetables.jpg",
    subCategories: {
      leafy: [
        { id: 4, name: "Spinach", price: 20, image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb" },
      ],
      roots: [
        { id: 5, name: "Carrot", price: 25, image: "https://tse3.mm.bing.net/th/id/OIP.eaIabuQxyVGLGBFyaGyGEAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" },
      ],
    },
  },
  "organic-dairy": {
    title: "Organic Dairy",
    image: "https://tse4.mm.bing.net/th/id/OIP.GNYQIQe-sLEd7dWIO2MLsAHaEK?rs=1&pid=ImgDetMain&o=7&rm=3",
    subCategories: {
      milk: [
        { id: 6, name: "Amul Milk", price: 60, image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/xrj8lmdwtc3ll27s9wvc" },
      ],
      cheese: [
        { id: 7, name: "Cheddar Cheese", price: 200, image: "https://tse1.mm.bing.net/th/id/OIP.2OYeC00pfg-bSWS6qwxFzwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" },
      ],
    },
  },
  "healthy-staples": {
    title: "Healthy Staples",
    image: "https://img.freepik.com/premium-photo/set-groats-grains-buckwheat-lentils-rice-millet-barley-corn-black-rice-blue-wooden-background-top-view-copy-space_187166-29262.jpg",
    subCategories: {
      rice: [
        { id: 8, name: "Basmati Rice", price: 90, image: "https://i5.walmartimages.com/asr/64b899f1-d010-4096-9bd7-855fdaf1858d.342e6202d2b176dcde63975ce77c2569.jpeg" },
      ],
      pulses: [
        { id: 9, name: "Toor Dal", price: 110, image: "https://5.imimg.com/data5/FA/FQ/MY-5329745/tata-sampann-toor-dal-500x500.jpg" },
      ],
    },
  },
};

export default catalog;
