
import torch
from torch import nn, optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, utils
import matplotlib.pyplot as plt
import numpy as np
from torchvision.utils import save_image
from PIL import Image

# Press the green button in the gutter to run the script.
class Generator(nn.Module):
    def __init__(self):
        super(Generator, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(100, 256),
            nn.LeakyReLU(0.2),
            nn.Linear(256, 512),
            nn.LeakyReLU(0.2),
            nn.Linear(512, 1024),
            nn.LeakyReLU(0.2),
            nn.Linear(1024, 3 * 128 * 128),  # Assuming 3 channel (RGB) images
            nn.Tanh()
        )

    def forward(self, z):
        img = self.model(z)
        img = img.view(img.size(0), 3, 128, 128)
        return img

    def generate_and_save_image(self, input, filepath):
        with torch.no_grad():  # Ensure gradients aren't calculated
            generated_image = self.forward(input)  # Generate the image
            save_image(generated_image, filepath)  # Save image
# Define the Discriminator
class Discriminator(nn.Module):
    def __init__(self):
        super(Discriminator, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(3 * 128 * 128, 1024),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(1024, 512),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )

    def forward(self, img):
        flattened = img.view(img.size(0), -1)
        output = self.model(flattened)
        return output


print(torch.cuda.is_available())

transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])

dataset = datasets.ImageFolder(root='6900068000Batch', transform=transform)
dataloader = DataLoader(dataset, batch_size=128, shuffle=True)

#Initialize Models
generator = Generator()
discriminator = Discriminator()

# Optimizers
optimizer_g = optim.Adam(generator.parameters(), lr=0.0004) # 0.0002 default
optimizer_d = optim.Adam(discriminator.parameters(), lr=0.0004)

#Loss Function
criterion = nn.BCELoss()


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
generator = generator.to(device)
discriminator = discriminator.to(device)


if __name__ == '__main__':
# Training loop
    epochs = 101  #Set Epoch amount

    for epoch in range(epochs):
        for i, (images, _) in enumerate(dataloader):
            # Prepare real and fake labels
            real = (torch.ones(images.size(0), 1) * 0.9).to(device)
            fake = torch.zeros(images.size(0), 1)

            # Train Discriminator with real images
            optimizer_d.zero_grad()
            outputs_real = discriminator(images)
            loss_real = criterion(outputs_real, real)

            # Train Discriminator with fake images
            z = torch.randn(images.size(0), 100)
            fake_images = generator(z)
            outputs_fake = discriminator(fake_images.detach())
            loss_fake = criterion(outputs_fake, fake)

            loss_d = loss_real + loss_fake
            loss_d.backward()
            optimizer_d.step()

            # Train Generator
            optimizer_g.zero_grad()
            outputs_fake = discriminator(fake_images)
            loss_g = criterion(outputs_fake, real)

            loss_g.backward()
            optimizer_g.step()

            if i % 100 == 0:
                print(
                    f"Epoch [{epoch}/{epochs}], Step [{i}/{len(dataloader)}], Loss D: {loss_d.item()}, Loss G: {loss_g.item()}")
            if epoch == 100:
                with torch.no_grad():
                    fixed_noise = torch.randn(4, 100, device=device)
                    fake_images = generator(fixed_noise).detach().cpu()
                    grid = utils.make_grid(fake_images, nrow=2, normalize=True)
                    plt.figure(figsize=(10, 10))
                    plt.axis("off")
                    plt.title("Generated Images")
                    plt.imshow(np.transpose(grid, (1, 2, 0)))
                    plt.show()

    torch.save(generator.state_dict(), 'generator_model.pth')
    print("Training complete")







