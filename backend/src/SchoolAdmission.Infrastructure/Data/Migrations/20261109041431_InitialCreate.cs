using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolAdmission.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "admission_classes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    total_seats = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admission_classes", x => x.id);
                    table.CheckConstraint("CK_admission_classes_total_seats_positive", "total_seats > 0");
                });

            migrationBuilder.CreateTable(
                name: "admission_holds",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    class_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<string>(type: "character varying(17)", maxLength: 17, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    expires_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    confirmed_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    cancelled_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admission_holds", x => x.id);
                    table.CheckConstraint("CK_admission_holds_status_valid", "status IN ('HELD', 'CONFIRMED', 'EXPIRED', 'CANCELLED')");
                    table.CheckConstraint("CK_admission_holds_student_id_17_digits", "length(student_id) = 17");
                    table.ForeignKey(
                        name: "FK_admission_holds_admission_classes_class_id",
                        column: x => x.class_id,
                        principalTable: "admission_classes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_holds_class_status_expiry",
                table: "admission_holds",
                columns: new[] { "class_id", "status", "expires_at_utc" });

            migrationBuilder.CreateIndex(
                name: "idx_holds_student_created",
                table: "admission_holds",
                columns: new[] { "student_id", "created_at_utc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admission_holds");

            migrationBuilder.DropTable(
                name: "admission_classes");
        }
    }
}
