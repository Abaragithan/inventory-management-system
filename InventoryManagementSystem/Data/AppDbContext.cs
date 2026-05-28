using InventoryManagementSystem.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(
            DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();

        public DbSet<Product> Products => Set<Product>();

        public DbSet<Category> Categories => Set<Category>();

        public DbSet<Supplier> Suppliers => Set<Supplier>();

        public DbSet<StockTransaction> StockTransactions
            => Set<StockTransaction>();

        public DbSet<PurchaseRequest> PurchaseRequests
            => Set<PurchaseRequest>();

        public DbSet<PurchaseRequestItem> PurchaseRequestItems
            => Set<PurchaseRequestItem>();

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<StockTransaction>()
                .HasKey(st => st.TransactionId);

            // Supplier ↔ User one-to-one relationship
            modelBuilder.Entity<Supplier>()
                .HasOne(s => s.User)
                .WithOne(u => u.Supplier)
                .HasForeignKey<Supplier>(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // Unique constraints
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Product>()
                .HasIndex(p => p.Barcode)
                .IsUnique();

            modelBuilder.Entity<Category>()
                .HasKey(c => c.CategoryId);

            modelBuilder.Entity<Category>()
                .HasIndex(c => c.Name)
                .IsUnique();

            // Decimal precision
            modelBuilder.Entity<Product>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.CostPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PurchaseRequest>()
                .HasKey(pr => pr.RequestId);


            modelBuilder.Entity<PurchaseRequest>()
                .HasIndex(pr => pr.RequestNumber)
                .IsUnique();

            modelBuilder.Entity<PurchaseRequest>()
                .HasOne(pr => pr.Supplier)
                .WithMany()
                .HasForeignKey(pr => pr.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseRequest>()
                .HasOne(pr => pr.RequestedByUser)
                .WithMany()
                .HasForeignKey(pr => pr.RequestedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseRequestItem>()
                .HasKey(pri => pri.RequestItemId);

            modelBuilder.Entity<PurchaseRequestItem>()
                .Property(pri => pri.UnitCost)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PurchaseRequestItem>()
                .HasOne(pri => pri.PurchaseRequest)
                .WithMany(pr => pr.PurchaseRequestItems)
                .HasForeignKey(pri => pri.RequestId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseRequestItem>()
                .HasOne(pri => pri.Product)
                .WithMany()
                .HasForeignKey(pri => pri.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}