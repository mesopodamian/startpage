using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAllOrigins",
            builder =>
            {
                builder.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader();
            });
    });

var app = builder.Build();

app.UseCors("AllowAllOrigins");

// ----------------------------------------------------------

ThemeSettings? themeSettings = null;

const string CONFIG_DIR_PATH = "config";
if (!Directory.Exists(CONFIG_DIR_PATH))
{
    Directory.CreateDirectory(CONFIG_DIR_PATH);
}

const string themeSettingsFilePath = $"{CONFIG_DIR_PATH}/themeSettings.json";


void SaveThemeSettings()
{
    var options = new JsonSerializerOptions { WriteIndented = true };

    string jsonString = JsonSerializer.Serialize(themeSettings, options);
    File.WriteAllText(themeSettingsFilePath, jsonString);
}

void LoadThemeSettings()
{
    if (!File.Exists(themeSettingsFilePath))
    {
        return;
    }

    string jsonString = File.ReadAllText(themeSettingsFilePath);
    themeSettings = JsonSerializer.Deserialize<ThemeSettings>(jsonString);
}

LoadThemeSettings();


app.MapGet("/theme", () =>
{
    Console.WriteLine("Sent theme settings");
    return themeSettings;
});

app.MapPost("/theme", ([FromBody] ThemeSettings settings) =>
{
    Console.WriteLine("Received theme settings");
    themeSettings = settings;
    SaveThemeSettings();
    return Results.Ok(themeSettings);
});

app.Run();

public class ThemeSettings {
    public bool RandomArt { get; set; }
    public string? ArtName { get; set; }
    public bool AccentColorFromArt { get; set; }
    public string? ClockFont { get; set; }
}
