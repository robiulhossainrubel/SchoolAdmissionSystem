using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;

namespace SchoolAdmission.Infrastructure.Data;

public class AdmissionDbContext : DbContext
{
    public AdmissionDbContext(DbContextOptions<AdmissionDbContext> options)
        : base(options)
    {
    }

    public DbSet<AdmissionClass> Classes => Set<AdmissionClass>();
    public DbSet<AdmissionHold> Holds => Set<AdmissionHold>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // AdmissionClass Entity Configuration
        modelBuilder.Entity<AdmissionClass>(entity =>
        {
            entity.ToTable("admission_classes", t =>
            {
                t.HasCheckConstraint("CK_admission_classes_total_seats_positive", "total_seats > 0");
            });

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id)
                  .HasColumnName("id");

            entity.Property(e => e.Name)
                  .HasColumnName("name")
                  .HasMaxLength(150)
                  .IsRequired();

            entity.Property(e => e.TotalSeats)
                  .HasColumnName("total_seats")
                  .IsRequired();

            entity.Property(e => e.CreatedAtUtc)
                  .HasColumnName("created_at_utc")
                  .HasColumnType("timestamp with time zone")
                  .HasDefaultValueSql("CURRENT_TIMESTAMP")
                  .IsRequired();

            entity.HasMany(e => e.Holds)
                  .WithOne(h => h.Class)
                  .HasForeignKey(h => h.ClassId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AdmissionHold Entity Configuration
        modelBuilder.Entity<AdmissionHold>(entity =>
        {
            entity.ToTable("admission_holds", t =>
            {
                t.HasCheckConstraint("CK_admission_holds_student_id_17_digits", "length(student_id) = 17");
                t.HasCheckConstraint("CK_admission_holds_status_valid", "status IN ('HELD', 'CONFIRMED', 'EXPIRED', 'CANCELLED')");
            });

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id)
                  .HasColumnName("id");

            entity.Property(e => e.ClassId)
                  .HasColumnName("class_id")
                  .IsRequired();

            entity.Property(e => e.StudentId)
                  .HasColumnName("student_id")
                  .HasMaxLength(17)
                  .IsRequired();

            entity.Property(e => e.Status)
                  .HasColumnName("status")
                  .HasMaxLength(20)
                  .HasConversion<string>()
                  .IsRequired();

            entity.Property(e => e.CreatedAtUtc)
                  .HasColumnName("created_at_utc")
                  .HasColumnType("timestamp with time zone")
                  .HasDefaultValueSql("CURRENT_TIMESTAMP")
                  .IsRequired();

            entity.Property(e => e.ExpiresAtUtc)
                  .HasColumnName("expires_at_utc")
                  .HasColumnType("timestamp with time zone")
                  .IsRequired();

            entity.Property(e => e.ConfirmedAtUtc)
                  .HasColumnName("confirmed_at_utc")
                  .HasColumnType("timestamp with time zone");

            entity.Property(e => e.CancelledAtUtc)
                  .HasColumnName("cancelled_at_utc")
                  .HasColumnType("timestamp with time zone");

            // Required Indexes from docs/04-DOMAIN-AND-DATABASE.md
            entity.HasIndex(e => new { e.ClassId, e.Status, e.ExpiresAtUtc })
                  .HasDatabaseName("idx_holds_class_status_expiry");

            entity.HasIndex(e => new { e.StudentId, e.CreatedAtUtc })
                  .HasDatabaseName("idx_holds_student_created");
        });
    }
}
