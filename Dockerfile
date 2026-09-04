FROM node:20-alpine

WORKDIR /app

# Dependencies install karne ke liye package files copy karein
COPY package*.json ./
RUN npm install

# Baaki saara source code copy karein (volume mapping se yeh live-sync rahega)
COPY . .

EXPOSE 3000

# Vite dev server ko host 0.0.0.0 par start karein taaki browser se access ho sake
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]